import { SupabaseClient } from "@supabase/supabase-js";

import { sendInstantReply } from "./actions/send-instant-reply";
import { sendTeamNotification } from "./actions/send-team-notification";

export type AutomationLead = {
  id: string;
  user_id: string;

  name: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;

  source: string | null;
  status: string;

  message: string | null;
};

type LeadCaptureSettings = {
  user_id: string;

  enabled: boolean;

  instant_reply_enabled: boolean;
  instant_reply_message: string | null;

  team_notification_enabled: boolean;
  notification_email: string | null;

  follow_up_enabled: boolean;
  follow_up_delay_minutes: number | null;
};

export type AutomationResult = {
  success: boolean;

  instantReply:
    | "sent"
    | "skipped"
    | "failed";

  teamNotification:
    | "sent"
    | "skipped"
    | "failed";

  followUp:
    | "scheduled"
    | "skipped"
    | "failed";
};

/*
  =========================================================
  EVENT LOGGER
  =========================================================

  Every important automation action creates a
  lead_events row.

  This will eventually power:
  - recent activity
  - automation history
  - dashboard statistics
  - debugging
*/

async function createLeadEvent(
  supabase: SupabaseClient,
  {
    userId,
    leadId,
    eventType,
    detail,
  }: {
    userId: string;
    leadId: string;
    eventType: string;
    detail?: string | null;
  }
) {
  const { error } =
    await supabase
      .from("lead_events")
      .insert({
        user_id: userId,
        lead_id: leadId,
        event_type: eventType,
        detail: detail || null,
      });

  if (error) {
    console.error(
      "Flowex lead event error:",
      error.message
    );
  }
}

/*
  =========================================================
  AUTOMATION ENGINE
  =========================================================

  IMPORTANT:

  The lead must already exist in the database
  before this function runs.

  An automation failure must never cause Flowex
  to lose the actual lead.
*/

export async function runLeadAutomation(
  supabase: SupabaseClient,
  lead: AutomationLead
): Promise<AutomationResult> {
  const result: AutomationResult = {
    success: true,

    instantReply: "skipped",
    teamNotification: "skipped",
    followUp: "skipped",
  };

  /*
    =========================================================
    LOAD AUTOMATION SETTINGS
    =========================================================
  */

  const {
    data: settings,
    error: settingsError,
  } =
    await supabase
      .from("lead_capture_settings")
      .select(
        `
          user_id,
          enabled,
          instant_reply_enabled,
          instant_reply_message,
          team_notification_enabled,
          notification_email,
          follow_up_enabled,
          follow_up_delay_minutes
        `
      )
      .eq(
        "user_id",
        lead.user_id
      )
      .single<LeadCaptureSettings>();

  if (
    settingsError ||
    !settings
  ) {
    console.error(
      "Flowex automation settings error:",
      settingsError?.message ||
        "Settings not found."
    );

    await createLeadEvent(
      supabase,
      {
        userId: lead.user_id,
        leadId: lead.id,
        eventType:
          "automation_failed",
        detail:
          "Lead capture settings could not be loaded.",
      }
    );

    return {
      ...result,
      success: false,
    };
  }

  /*
    =========================================================
    AUTOMATION DISABLED
    =========================================================
  */

  if (!settings.enabled) {
    await createLeadEvent(
      supabase,
      {
        userId: lead.user_id,
        leadId: lead.id,
        eventType:
          "automation_skipped",
        detail:
          "Lead Capture automation is disabled.",
      }
    );

    return result;
  }

  /*
    =========================================================
    INSTANT REPLY
    =========================================================

    This action runs independently.

    If it fails, Flowex records the failure and
    continues processing the other actions.
  */

  if (
    settings.instant_reply_enabled
  ) {
    if (!lead.email) {
      result.instantReply =
        "skipped";

      await createLeadEvent(
        supabase,
        {
          userId: lead.user_id,
          leadId: lead.id,
          eventType:
            "instant_reply_skipped",
          detail:
            "Lead does not contain an email address.",
        }
      );
    } else {
      const replyResult =
        await sendInstantReply({
          lead,
          message:
            settings.instant_reply_message,
        });

      if (replyResult.success) {
        result.instantReply =
          "sent";

        await createLeadEvent(
          supabase,
          {
            userId: lead.user_id,
            leadId: lead.id,
            eventType:
              "instant_reply_sent",
            detail:
              replyResult.emailId
                ? `Instant reply sent successfully. Provider email ID: ${replyResult.emailId}`
                : "Instant reply sent successfully.",
          }
        );

        /*
          Mark the lead as replied only after
          the customer reply actually succeeds.
        */

        const {
          error: statusError,
        } =
          await supabase
            .from("leads")
            .update({
              status: "replied",
              updated_at:
                new Date().toISOString(),
            })
            .eq(
              "id",
              lead.id
            )
            .eq(
              "user_id",
              lead.user_id
            );

        if (statusError) {
          console.error(
            "Flowex lead status update error:",
            statusError.message
          );
        }
      } else {
        result.instantReply =
          "failed";

        result.success =
          false;

        await createLeadEvent(
          supabase,
          {
            userId: lead.user_id,
            leadId: lead.id,
            eventType:
              "instant_reply_failed",
            detail:
              replyResult.error ||
              "Instant reply failed.",
          }
        );
      }
    }
  }

  /*
    =========================================================
    TEAM NOTIFICATION
    =========================================================

    This action is completely independent from
    the customer instant reply.

    Therefore:

    Instant reply failure does NOT prevent the
    business notification from being attempted.
  */

  if (
    settings.team_notification_enabled
  ) {
    if (
      !settings.notification_email?.trim()
    ) {
      result.teamNotification =
        "skipped";

      await createLeadEvent(
        supabase,
        {
          userId: lead.user_id,
          leadId: lead.id,
          eventType:
            "team_notification_skipped",
          detail:
            "No notification email is configured.",
        }
      );
    } else {
      const notificationResult =
        await sendTeamNotification({
          lead,

          notificationEmail:
            settings.notification_email,
        });

      if (
        notificationResult.success
      ) {
        result.teamNotification =
          "sent";

        await createLeadEvent(
          supabase,
          {
            userId: lead.user_id,
            leadId: lead.id,
            eventType:
              "team_notification_sent",
            detail:
              notificationResult.emailId
                ? `Team notification sent successfully. Provider email ID: ${notificationResult.emailId}`
                : "Team notification sent successfully.",
          }
        );
      } else {
        result.teamNotification =
          "failed";

        result.success =
          false;

        await createLeadEvent(
          supabase,
          {
            userId: lead.user_id,
            leadId: lead.id,
            eventType:
              "team_notification_failed",
            detail:
              notificationResult.error ||
              "Team notification failed.",
          }
        );
      }
    }
  }

  /*
    =========================================================
    FOLLOW-UP
    =========================================================

    We still deliberately do NOT fake scheduled
    execution.

    A proper persistent scheduler/queue comes next
    after the immediate automation pipeline works.
  */

  if (
    settings.follow_up_enabled
  ) {
    if (
      settings.follow_up_delay_minutes &&
      settings.follow_up_delay_minutes > 0
    ) {
      result.followUp =
        "skipped";

      await createLeadEvent(
        supabase,
        {
          userId: lead.user_id,
          leadId: lead.id,
          eventType:
            "follow_up_pending",
          detail:
            `Follow-up requested after ${settings.follow_up_delay_minutes} minutes. Scheduler not connected yet.`,
        }
      );
    } else {
      result.followUp =
        "skipped";

      await createLeadEvent(
        supabase,
        {
          userId: lead.user_id,
          leadId: lead.id,
          eventType:
            "follow_up_skipped",
          detail:
            "Follow-up is enabled but no valid delay is configured.",
        }
      );
    }
  }

  /*
    =========================================================
    ENGINE COMPLETED
    =========================================================

    This event means Flowex finished attempting
    all actions that were currently available.

    It does NOT necessarily mean every individual
    action succeeded.

    The result + individual events tell us that.
  */

  await createLeadEvent(
    supabase,
    {
      userId: lead.user_id,
      leadId: lead.id,
      eventType:
        "automation_processed",
      detail:
        result.success
          ? "Flowex processed the lead successfully."
          : "Flowex processed the lead, but one or more automation actions failed.",
    }
  );

  return result;
}