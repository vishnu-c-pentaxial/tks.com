export default function JsonScript({ text, ...props }) {
  return (
    <script
      {...props}
      ref={(node) => {
        if (node && node.textContent !== text) node.textContent = text;
      }}
    />
  );
}
