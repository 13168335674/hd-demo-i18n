// 多语言配置
const lngs = {
  en: { nativeName: "English" },
  zh: { nativeName: "中文" },
};

// 重新渲染页面
function rerender() {
  $("body").localize();
  $("title").text($.t("head.title"));

  console.log(
    `ADI-LOG => i18next.t("common:title");`,
    i18next.t("common:title")
  );
}

// 异步加载语言包

// 初始化 i18next
const initI18next = () => {
  i18next
    .use(i18nextBrowserLanguageDetector)
    .use(i18nextHttpBackend)
    .init(
      {
        debug: true,
        load: "languageOnly",
        backend: {
          loadPath: "/locales/{{lng}}/{{ns}}.json",
        },
        lng: "zh", // 默认语言
        fallbackLng: "zh", // 备用语言
        ns: ["locales", "common", "validation"], // 命名空间
        defaultNS: "locales", // 默认命名空间
        interpolation: {
          format: function (value, format, lng) {
            if (format === "uppercase") return value.toUpperCase();
            const _lng = lng === "zh" ? "zh-cn" : lng;
            if (value instanceof Date)
              return moment(value).locale(_lng).format(format);
            return value;
          },
        },
      },
      (err, t) => {
        if (err) return console.error(err);

        initJqueryI18next();
        initLanguageSwitcher();
        initVue();
        rerender();
      }
    );
};

// 初始化 jqueryI18next
const initJqueryI18next = () => {
  jqueryI18next.init(i18next, $, { useOptionsAttr: true });
};

// 初始化语言切换器
const initLanguageSwitcher = () => {
  Object.keys(lngs).map((lng) => {
    const opt = new Option(lngs[lng].nativeName, lng);
    if (lng === i18next.resolvedLanguage) {
      opt.setAttribute("selected", "selected");
    }
    $("#languageSwitcher").append(opt);
  });

  handleLanguageChangeFooterMessage();

  $("#languageSwitcher").change(() => {
    console.log(`🚀 ADI-LOG ~ $ ~ languageSwitcher-change`);
    // 异步加载语言包并初始化
    i18next.loadNamespaces(["locales"], () => {
      // 初始化完成后执行其他操作
      console.log(`🚀 ADI-LOG ~ $ ~ i18next-loadNamespaces`);
      handleLanguageChange();
    });
  });
};

// 处理语言切换事件
const handleLanguageChange = () => {
  const chosenLng = $("#languageSwitcher")
    .find("option:selected")
    .attr("value");
  i18next.changeLanguage(chosenLng, () => {
    rerender();
    handleLanguageChangedNotification();
    handleLanguageChangeFooterMessage();
  });
};

// 处理语言切换通知
let languageChangedCounter = 0;
const handleLanguageChangedNotification = () => {
  languageChangedCounter++;
  $(".languageChangedNotification").each(function () {
    $(this).localize({ count: languageChangedCounter });
  });
};

// 处理语音切换时间
const handleLanguageChangeFooterMessage = () => {
  // 获取所有具有 .footerMessage 类的元素
  const footerMessages = document.querySelectorAll(".footerMessage.jqFlag");

  // 使用 i18next 格式化日期
  const formattedDate = i18next.t("footer.date", { date: new Date() });

  // 遍历每个元素
  footerMessages.forEach(function (element) {
    // 更新元素的文本内容
    element.textContent = formattedDate;
  });
};

// 初始化 Vue.js
const initVue = () => {
  Vue.use(I18NextVue, {
    i18next,
    // rerenderOn: ["initialized", "languageChanged", "loaded"],
  });

  new Vue({
    el: "#app",
    data: {},
    methods: {},
    template: `
      <div>
        <h1 class="title">Vue.js@2.6.10</h1>
        <p class="greeting">{{ $t('greeting') }}</p>
        <p class="currency">{{ $t('intlCurrencyWithOptionsSimplified', { val: 3000 }) }}</p>
        <p class="singularWithCount">{{ $t('singularWithCount', { count: 1 }) }}</p>
        <p class="singularWithCount">{{ $t('singularWithCount', { count: 2 }) }}</p>
        <footer id="footer">
          <p
            class="languageChangedNotification"
            data-i18n="footer.counter"
            data-i18n-options='{ "count": 0 }'
          ></p>
          <p class="footerMessage">{{ $t('footer.date', { date: new Date() }) }}</p>
        </footer>
      </div>
    `,
  });
};

// 页面加载完成后执行初始化
$(function () {
  initI18next();
});
