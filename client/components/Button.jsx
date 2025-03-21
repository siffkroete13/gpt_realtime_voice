import "./Button.css";

export default function Button({ icon, children, onClick, className = "" }) {
  return (
    <button className={`button ${className}`} onClick={onClick}>
      {icon}
      {children}
    </button>
  );
}