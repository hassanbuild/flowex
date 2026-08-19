export default function TestExternalFormPage() {
  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <form className="mx-auto max-w-md rounded-2xl bg-white p-6 shadow">
        <h1 className="mb-6 text-2xl font-bold">
          Test Lead Form
        </h1>

        <label className="mb-2 block text-sm font-semibold">
          Name
        </label>

        <input
          type="text"
          name="name"
          className="mb-4 w-full rounded-lg border p-3"
        />

        <label className="mb-2 block text-sm font-semibold">
          Email
        </label>

        <input
          type="email"
          name="email"
          className="mb-4 w-full rounded-lg border p-3"
        />

        <label className="mb-2 block text-sm font-semibold">
          Budget
        </label>

        <input
          type="number"
          name="budget"
          className="mb-6 w-full rounded-lg border p-3"
        />

        <button
          type="submit"
          className="w-full rounded-lg bg-black p-3 font-semibold text-white"
        >
          Submit
        </button>
      </form>
    </main>
  );
}