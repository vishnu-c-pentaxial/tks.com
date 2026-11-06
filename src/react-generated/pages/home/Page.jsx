import PageRuntime from "../../../components/PageRuntime.jsx";
import Header from "../../components/headers/Header_2f39a77a.jsx";
import Footer from "../../components/footers/Footer_ec6de7de.jsx";
import Content from "./Content.jsx";
import scripts from "../../../site/pages/home/scripts.json";
import PageExtras from "./PageExtras.jsx";
import After from "./After.jsx";

export default function Page() {
  return (
    <PageRuntime scripts={scripts}>
      <div id="page" className="site">
        <Header />
        <Content />
        <Footer />
        <PageExtras />
      </div>
      <After />
    </PageRuntime>
  );
}
