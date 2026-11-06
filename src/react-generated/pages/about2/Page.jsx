import PageRuntime from "../../../components/PageRuntime.jsx";
import Header from "../../components/headers/Header_0c41ed47.jsx";
import Footer from "../../components/footers/Footer_614b6f96.jsx";
import Content from "./Content.jsx";
import scripts from "../../../site/pages/about2/scripts.json";
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
