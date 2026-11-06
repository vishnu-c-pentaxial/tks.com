import PageRuntime from "../../../components/PageRuntime.jsx";
import Header from "../../components/headers/Header_dfae2bbe.jsx";
import Footer from "../../components/footers/Footer_e8275cc4.jsx";
import Content from "./Content.jsx";
import scripts from "../../../site/pages/booking/scripts.json";
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
