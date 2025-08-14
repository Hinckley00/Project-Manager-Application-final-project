import clsx from "clsx";


const Button = ({ className, label, type = "button", icon, onClick = () => {} }) => {
  return (
    <button
      type={type || "button"}
      onClick={onClick}
      className={clsx("px-3 py-2 outline-none rounded-full", className)}
    >
      {icon && icon }
      <span>{label}</span>
    </button>
  );
};

export default Button;
