function install(
  Vue,
  { i18next, rerenderOn = ["languageChanged", "loaded", "added", "removed"] }
) {
  const genericT = i18next.t.bind(i18next);
  const changeTracker = Vue.observable({ lastI18nChange: new Date() });
  const invalidate = () => (changeTracker.lastI18nChange = new Date());
  const usingTranslation = () => changeTracker.lastI18nChange;
  rerenderOn.forEach((event) => {
    var _a;
    switch (event) {
      case "added":
      case "removed":
        (_a = i18next.store) === null || _a === void 0
          ? void 0
          : _a.on(event, invalidate);
        break;
      default:
        i18next.on(event, invalidate);
        break;
    }
  });
  Vue.mixin({
    beforeCreate() {
      var _a, _b;
      const options = this.$options;
      if (!options.__i18n && !options.i18nOptions) {
        this.__translate = undefined;
        return;
      }
      const name = this.$options.name;
      const rand = ((Math.random() * 10 ** 8) | 0).toString();
      const localNs = [name, rand].filter((x) => !!x).join("-");
      this.__bundles = [];
      const loadBundle = (bundle) => {
        Object.entries(bundle).forEach(([lng, resources]) => {
          i18next.addResourceBundle(lng, localNs, resources, true, false);
          this.__bundles.push([lng, localNs]);
        });
      };
      (_a = options.__i18n) === null || _a === void 0
        ? void 0
        : _a.forEach((bundle) => {
            loadBundle(JSON.parse(bundle));
          });
      let { lng, ns, keyPrefix } = handleI18nOptions(options, loadBundle);
      if (
        (_b = this.__bundles) === null || _b === void 0 ? void 0 : _b.length
      ) {
        ns = [localNs].concat(ns !== null && ns !== void 0 ? ns : []);
      }
      const t = getTranslationFunction(lng, ns);
      this.__translate = (key, options) => {
        if (!keyPrefix || includesNs(key)) {
          return t(key, options);
        } else {
          return t(keyPrefix + "." + key, options);
        }
      };
    },
    destroyed() {
      var _a;
      (_a = this.__bundles) === null || _a === void 0
        ? void 0
        : _a.forEach(([lng, ns]) => i18next.removeResourceBundle(lng, ns));
    },
  });
  Vue.prototype.$t = function (key, options) {
    var _a;
    usingTranslation();
    if (i18next.isInitialized) {
      return (
        (_a = this === null || this === void 0 ? void 0 : this.__translate) !==
          null && _a !== void 0
          ? _a
          : genericT
      )(key, options);
    } else {
      return key;
    }
  };
  Vue.prototype.$i18next =
    typeof Proxy === "function"
      ? new Proxy(i18next, {
          get(target, prop) {
            usingTranslation();
            return Reflect.get(target, prop);
          },
        })
      : i18next;
  function getTranslationFunction(lng, ns) {
    if (lng) {
      return i18next.getFixedT(lng, ns);
    } else if (ns) {
      return i18next.getFixedT(null, ns);
    } else {
      return genericT;
    }
  }
  function includesNs(key) {
    const nsSeparator = i18next.options.nsSeparator;
    return typeof nsSeparator === "string" && key.includes(nsSeparator);
  }
  function handleI18nOptions(options, loadBundle) {
    let lng;
    let ns;
    let keyPrefix;
    if (options.i18nOptions) {
      let messages;
      let namespaces;
      ({
        lng,
        namespaces = i18next.options.defaultNS,
        keyPrefix,
        messages,
      } = options.i18nOptions);
      if (messages) {
        loadBundle(messages);
      }
      ns = typeof namespaces === "string" ? [namespaces] : namespaces;
      if (ns) {
        i18next.loadNamespaces(ns);
      }
    }
    return { lng, ns, keyPrefix };
  }
  const slotNamePattern = new RegExp("{\\s*([a-z0-9\\-]+)\\s*}", "gi");
  const TranslationComponent = {
    functional: true,
    props: {
      translation: {
        type: String,
        required: true,
      },
    },
    render(_createElement, context) {
      const textNode = context._v;
      const translation = context.props.translation;
      const result = [];
      let match;
      let lastIndex = 0;
      while ((match = slotNamePattern.exec(translation)) !== null) {
        result.push(textNode(translation.substring(lastIndex, match.index)));
        const slot = context.scopedSlots[match[1]];
        if (slot) {
          const nodes = slot({});
          nodes === null || nodes === void 0
            ? void 0
            : nodes.forEach((n) => result.push(n));
        } else {
          result.push(textNode(match[0]));
        }
        lastIndex = slotNamePattern.lastIndex;
      }
      result.push(textNode(translation.substring(lastIndex)));
      return result;
    },
  };
  Vue.component("i18next", TranslationComponent);
}
window.I18NextVue = {
  install,
};
