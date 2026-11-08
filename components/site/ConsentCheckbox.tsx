import Link from "next/link";

/** The required "I agree" box on forms that collect personal details. Its value is checked again on the server. */
export function ConsentCheckbox({ children }: { children: React.ReactNode }) {
  return (
    <label className="flex items-start gap-3 text-sm text-muted-foreground">
      <input type="checkbox" name="consent" value="yes" required className="mt-0.5 size-4 shrink-0 accent-primary" />
      <span>
        {children} See our{" "}
        <Link href="/privacy-policy" target="_blank" className="font-medium text-primary underline underline-offset-2">
          privacy policy
        </Link>
        .
      </span>
    </label>
  );
}
