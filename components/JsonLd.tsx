// Renders JSON-LD structured data. "<" is escaped so content can't close the script tag.
export default function JsonLd({ data }: { data: object | object[] }) {
  const list = Array.isArray(data) ? data : [data];
  return (
    <>
      {list.map((d, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(d).replace(/</g, "\\u003c") }}
        />
      ))}
    </>
  );
}
