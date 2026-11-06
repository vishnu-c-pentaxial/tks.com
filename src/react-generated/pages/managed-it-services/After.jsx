import JsonScript from "../../../components/JsonScript.jsx";

export default function After() {
  return (
    <>
      <div className={"ct-modal ct-modal-search"}>
        {"\n        "}
        <div className={"ct-modal-close"}>
          <i className={"ct-icon-close"} />
        </div>
        {"\n        "}
        <div className={"ct-modal-overlay"} />
        {"\n        "}
        <div className={"ct-modal-content"}>
          {"\n            "}
          <form role={"search"} method={"get"} className={"search-form-popup"} action={"/"}>
            {"\n                "}
            <div className={"searchform-wrap"}>
              {"\n                    "}
              <input type={"text"} placeholder={"Enter Keywords"} id={"search"} name={"s"} className={"search-field"} />
              {"\n                    "}
              <button type={"submit"} className={"search-submit"}>
                <i className={"caseicon-search"} />
              </button>
              {"\n                "}
            </div>
            {"\n            "}
          </form>
          {"\n        "}
        </div>
        {"\n    "}
      </div>
      <div className={"ct-hidden-sidebar-wrap"}>
        {"\n            "}
        <div className={"ct-hidden-sidebar-overlay"} />
        {"\n            "}
        <div className={"ct-hidden-sidebar"}>
          {"\n                "}
          <div className={"ct-hidden-close"}>
            <i className={"caseicon-close-alt"} />
          </div>
          {"\n                "}
          <div className={"ct-hidden-sidebar-inner"}>
            {"\n                    "}
            <div className={"ct-hidden-sidebar-holder"}>
              {"\n                        "}
              <section id={"block-5"} className={"widget widget_block"}>
                <div className={"widget-content"}>
                  <div className={"wp-block-group"}>
                    <div className={"wp-block-group__inner-container is-layout-flow wp-block-group-is-layout-flow"}>
                      <h2 className={"wp-block-heading"}>{"Archives"}</h2>
                      <div className={"wp-block-archives-list wp-block-archives"}>{"No archives to show."}</div>
                    </div>
                  </div>
                </div>
              </section>
              <section id={"block-6"} className={"widget widget_block"}>
                <div className={"widget-content"}>
                  <div className={"wp-block-group"}>
                    <div className={"wp-block-group__inner-container is-layout-flow wp-block-group-is-layout-flow"}>
                      <h2 className={"wp-block-heading"}>{"Categories"}</h2>
                      <ul
                        className={"wp-block-categories-list wp-block-categories-taxonomy-category wp-block-categories"}
                      >
                        <li className={"cat-item-none"}>{"No categories"}</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </section>
              {"                    "}
            </div>
            {"\n                "}
          </div>
          {"\n            "}
        </div>
        {"\n        "}
      </div>
      <div className={"ct-cursor ct-js-cursor"}>
        {"\n            "}
        <div className={"ct-cursor-wrapper"}>
          {"\n                "}
          <div className={"ct-cursor--follower ct-js-follower"} />
          {"\n                "}
          <div className={"ct-cursor--label ct-js-label"} />
          {"\n                "}
          <div className={"ct-cursor--icon ct-js-icon"} />
          {"\n            "}
        </div>
        {"\n        "}
      </div>
      <JsonScript
        type={"speculationrules"}
        text={
          '\n{"prerender":[{"source":"document","where":{"and":[{"href_matches":"/*"},{"not":{"href_matches":["/wp-*.php","/wp-admin/*","/wp-content/uploads/*","/wp-content/*","/wp-content/plugins/*","/wp-content/themes/itfirm-child/*","/wp-content/themes/itfirm/*","/*\\\\?(.+)"]}},{"not":{"selector_matches":"a[rel~=\\"nofollow\\"]"}},{"not":{"selector_matches":".no-prerender, .no-prerender a"}},{"not":{"selector_matches":".no-prefetch, .no-prefetch a"}}]},"eagerness":"moderate"}]}\n'
        }
      />
      <style>
        {
          "\n\t\t.googlesitekit-sign-in-with-google__frontend-output-button{max-width:320px}\n\t\t.interim-login #login>.googlesitekit-sign-in-with-google__frontend-output-button{margin-bottom:16px}\n\t\t"
        }
      </style>
      <link
        rel={"stylesheet"}
        id={"elementor-post-3180-css"}
        href={"/site/wp-content/uploads/elementor/css/post-3180.css"}
        media={"all"}
      />
      <link
        rel={"stylesheet"}
        id={"elementor-post-6845-css"}
        href={"/site/wp-content/uploads/elementor/css/post-6845.css"}
        media={"all"}
      />
      <link
        rel={"stylesheet"}
        id={"elementor-post-11155-css"}
        href={"/site/wp-content/uploads/elementor/css/post-11155.css"}
        media={"all"}
      />
      <link
        rel={"stylesheet"}
        id={"elementor-post-3248-css"}
        href={"/site/wp-content/uploads/elementor/css/post-3248.css"}
        media={"all"}
      />
      <link
        rel={"stylesheet"}
        id={"forminator-module-css-12416-css"}
        href={"/site/wp-content/uploads/forminator/12416_a9d85b5ccfc7a4a3c1f39e6ce9172ece/css/style-12416.css"}
        media={"all"}
      />
      <link
        rel={"stylesheet"}
        id={"forminator-icons-css"}
        href={"/site/wp-content/plugins/forminator/assets/forminator-ui/css/forminator-icons.min.css"}
        media={"all"}
      />
      <link
        rel={"stylesheet"}
        id={"forminator-utilities-css"}
        href={"/site/wp-content/plugins/forminator/assets/forminator-ui/css/src/forminator-utilities.min.css"}
        media={"all"}
      />
      <link
        rel={"stylesheet"}
        id={"forminator-forms-material-base-css"}
        href={
          "/site/wp-content/plugins/forminator/assets/forminator-ui/css/src/form/forminator-form-material.base.min.css"
        }
        media={"all"}
      />
      <link
        rel={"stylesheet"}
        id={"forminator-forms-material-full-css"}
        href={
          "/site/wp-content/plugins/forminator/assets/forminator-ui/css/src/form/forminator-form-material.full.min.css"
        }
        media={"all"}
      />
      <link
        rel={"stylesheet"}
        id={"intlTelInput-forminator-css-css"}
        href={"/site/wp-content/plugins/forminator/assets/css/intlTelInput.min.css"}
        media={"all"}
      />
      <link rel={"stylesheet"} id={"buttons-css"} href={"/site/wp-includes/css/buttons.min.css"} media={"all"} />
      <link
        rel={"stylesheet"}
        id={"forminator-font-roboto-css"}
        href={"https://fonts.bunny.net/css?family=Roboto&ver=1.0"}
        media={"all"}
      />
      <link
        rel={"stylesheet"}
        id={"swiper-css"}
        href={"/site/wp-content/plugins/elementor/assets/lib/swiper/v8/css/swiper.min.css"}
        media={"all"}
      />
      <link
        rel={"stylesheet"}
        id={"e-swiper-css"}
        href={"/site/wp-content/plugins/elementor/assets/css/conditionals/e-swiper.min.css"}
        media={"all"}
      />
      <link
        rel={"stylesheet"}
        id={"widget-image-gallery-css"}
        href={"/site/wp-content/plugins/elementor/assets/css/widget-image-gallery.min.css"}
        media={"all"}
      />
      <link
        rel={"stylesheet"}
        id={"rs-plugin-settings-css"}
        href={"/site/wp-content/plugins/revslider/public/assets/css/rs6.css"}
        media={"all"}
      />
      <style id={"rs-plugin-settings-inline-css"}>
        {"\n#rs-demo-id {}\n/*# sourceURL=rs-plugin-settings-inline-css */\n"}
      </style>
      <JsonScript
        id={"wp-emoji-settings"}
        type={"application/json"}
        text={
          '\n{"baseUrl":"https://s.w.org/images/core/emoji/17.0.2/72x72/","ext":".png","svgUrl":"https://s.w.org/images/core/emoji/17.0.2/svg/","svgExt":".svg","source":{"concatemoji":"/site/wp-includes/js/wp-emoji-release.min.js"}}\n'
        }
      />
      <JsonScript
        id={"optimization-detective-detect-args"}
        type={"application/json"}
        text={
          '\n["/site/wp-content/plugins/optimization-detective/detect.min.js",{"minViewportAspectRatio":0.4,"maxViewportAspectRatio":2.5,"isDebug":false,"extensionModuleUrls":["/site/wp-content/plugins/image-prioritizer/detect.min.js"],"restApiEndpoint":"https://thetksgroup.com/wp-json/optimization-detective/v1/url-metrics:store","currentETag":"fd2960b778a8a08a18d28bfd152b2585","currentUrl":"https://thetksgroup.com/managed-it-services/","urlMetricSlug":"97eefb31c7514480f3fd2a8757a75940","cachePurgePostId":11455,"urlMetricHMAC":"c015440ca0ec918e108a1b9194df46a1","urlMetricGroupStatuses":[{"minimumViewportWidth":0,"maximumViewportWidth":480,"complete":false},{"minimumViewportWidth":480,"maximumViewportWidth":600,"complete":false},{"minimumViewportWidth":600,"maximumViewportWidth":782,"complete":false},{"minimumViewportWidth":782,"maximumViewportWidth":null,"complete":true}],"storageLockTTL":60,"freshnessTTL":604800,"webVitalsLibrarySrc":"/site/wp-content/plugins/optimization-detective/build/web-vitals.js","gzdecodeAvailable":true,"maxUrlMetricSize":1048576}]\n'
        }
      />
    </>
  );
}
