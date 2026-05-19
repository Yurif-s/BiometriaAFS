import { FaClipboardList } from "react-icons/fa";
import logo from "../assets/logo.png";

export default function Header() {
  return (
    <header className="header">
      <div className="logo-area">
        <img src={logo} alt="logo" className="logo" />
      </div>
      <div className="title-area">
        <div className="icon-box">
          <FaClipboardList />
        </div>
        <h1>Sistema de Frequência</h1>
      </div>
    </header>
  );
}