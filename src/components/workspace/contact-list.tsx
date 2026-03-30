import type { Contact } from "@/lib/types";

const SELF_CONTACT_ID = "contact-self";

function contactDisplayName(c: Contact): string {
  if (c.id === SELF_CONTACT_ID) {
    return `You (${c.name})`;
  }
  return c.name;
}

export function ContactList({ contacts }: { contacts: Contact[] }) {
  if (contacts.length === 0) {
    return (
      <p className="px-3 py-2 text-sm text-zinc-500 dark:text-zinc-400">
        No contacts yet.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-0.5">
      {contacts.map((c) => (
        <li
          key={c.id}
          className="rounded-md px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-900"
        >
          <div className="font-medium text-zinc-900 dark:text-zinc-100">
            {contactDisplayName(c)}
          </div>
          <div className="truncate text-xs text-zinc-500 dark:text-zinc-400">
            {c.email}
          </div>
        </li>
      ))}
    </ul>
  );
}
