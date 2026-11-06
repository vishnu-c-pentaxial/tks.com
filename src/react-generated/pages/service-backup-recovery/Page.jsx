import PageRuntime from "../../../components/PageRuntime.jsx";
import Header from "../../components/headers/Header_ab39d1fb.jsx";
import Footer from "../../components/footers/Footer_4bc7d65c.jsx";
import Content from "./Content.jsx";
import scripts from "../../../site/pages/service-backup-recovery/scripts.json";
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
