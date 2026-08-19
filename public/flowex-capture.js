(function () {
  /*
    Capture the script element immediately while
    document.currentScript still points to it.
  */

  var scriptElement =
    document.currentScript;

  if (!scriptElement) {
    console.error(
      "Flowex: capture script could not identify itself."
    );
    return;
  }

  var publicKey =
    scriptElement.getAttribute(
      "data-flowex-key"
    );

  if (!publicKey) {
    console.error(
      "Flowex: data-flowex-key is missing."
    );
    return;
  }

  var endpoint =
    scriptElement.getAttribute(
      "data-flowex-endpoint"
    );

  if (!endpoint) {
    try {
      var scriptUrl =
        new URL(
          scriptElement.src
        );

      endpoint =
        scriptUrl.origin +
        "/api/intake/" +
        encodeURIComponent(
          publicKey
        );
    } catch (error) {
      console.error(
        "Flowex: could not build intake endpoint.",
        error
      );
      return;
    }
  }

  function formToObject(
    form
  ) {
    var formData =
      new FormData(
        form
      );

    var payload = {};

    formData.forEach(
      function (
        value,
        key
      ) {
        if (
          typeof value !==
          "string"
        ) {
          return;
        }

        if (
          payload[key] !==
          undefined
        ) {
          payload[key] =
            String(
              payload[key]
            ) +
            ", " +
            value;

          return;
        }

        payload[key] =
          value;
      }
    );

    return payload;
  }

  function hasUsableFields(
    payload
  ) {
    return Object.keys(
      payload
    ).some(
      function (
        key
      ) {
        var value =
          payload[key];

        return (
          typeof value ===
            "string" &&
          value.trim()
            .length > 0
        );
      }
    );
  }

  async function sendToFlowex(
    form
  ) {
    var payload =
      formToObject(
        form
      );

    if (
      !hasUsableFields(
        payload
      )
    ) {
      console.warn(
        "Flowex: submission contained no usable fields."
      );
      return;
    }

    try {
      var response =
        await fetch(
          endpoint,
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify(
                payload
              ),

            keepalive:
              true,
          }
        );

      if (
        !response.ok
      ) {
        console.error(
          "Flowex: intake rejected submission.",
          response.status
        );

        return;
      }

      console.log(
        "Flowex: lead captured successfully."
      );
    } catch (error) {
      console.error(
        "Flowex: capture request failed.",
        error
      );
    }
  }

  /*
    Listen at document level.

    This also works for React/Lovable forms
    that are rendered after this script loads.
  */

  document.addEventListener(
    "submit",
    function (
      event
    ) {
      var form =
        event.target;

      if (
        !(form instanceof HTMLFormElement)
      ) {
        return;
      }

      void sendToFlowex(
        form
      );
    },
    true
  );

  console.log(
    "Flowex Capture loaded."
  );
})();