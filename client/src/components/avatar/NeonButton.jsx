export default function NeonButton({ label, onClick, link }) {
  const Tag = link ? "a" : "button";

  return (
    <Tag
      href={link}
      onClick={onClick}
      className="neon-btn font-semibold tracking-wide"
    >
      {label}
    </Tag>
  );
}
