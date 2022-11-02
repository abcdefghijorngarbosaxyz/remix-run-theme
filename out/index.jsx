"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ThemeProvider = exports.useTheme = void 0;
const react_1 = __importStar(require("react"));
const colorSchemes = ["light", "dark"];
const MEDIA = "(prefers-color-scheme: dark)";
const isServer = typeof window === "undefined";
const ThemeContext = (0, react_1.createContext)(undefined);
const defaultContext = { setTheme: (_) => { }, themes: [] };
const useTheme = () => { var _a; return (_a = (0, react_1.useContext)(ThemeContext)) !== null && _a !== void 0 ? _a : defaultContext; };
exports.useTheme = useTheme;
const ThemeProvider = (props) => {
    const context = (0, react_1.useContext)(ThemeContext);
    // Ignore nested context providers, just passthrough children
    if (context)
        return <react_1.Fragment>{props.children}</react_1.Fragment>;
    return <Theme {...props}/>;
};
exports.ThemeProvider = ThemeProvider;
const defaultThemes = ["light", "dark"];
const Theme = ({ forcedTheme, disableTransitionOnChange = false, enableSystem = true, enableColorScheme = true, storageKey = "theme", themes = defaultThemes, defaultTheme = enableSystem ? "system" : "light", attribute = "data-theme", value, children, nonce, }) => {
    const [theme, setThemeState] = (0, react_1.useState)(() => getTheme(storageKey, defaultTheme));
    const [resolvedTheme, setResolvedTheme] = (0, react_1.useState)(() => getTheme(storageKey));
    const attrs = !value ? themes : Object.values(value);
    const applyTheme = (0, react_1.useCallback)((theme) => {
        let resolved = theme;
        if (!resolved)
            return;
        // If theme is system, resolve it before setting theme
        if (theme === "system" && enableSystem) {
            resolved = getSystemTheme();
        }
        const name = value ? value[resolved] : resolved;
        const enable = disableTransitionOnChange ? disableAnimation() : null;
        const d = document.documentElement;
        if (attribute === "class") {
            d.classList.remove(...attrs);
            if (name)
                d.classList.add(name);
        }
        else {
            if (name) {
                d.setAttribute(attribute, name);
            }
            else {
                d.removeAttribute(attribute);
            }
        }
        if (enableColorScheme) {
            const fallback = colorSchemes.includes(defaultTheme)
                ? defaultTheme
                : null;
            const colorScheme = colorSchemes.includes(resolved) ? resolved : fallback;
            // @ts-ignore
            d.style.colorScheme = colorScheme;
        }
        enable === null || enable === void 0 ? void 0 : enable();
    }, []);
    const setTheme = (0, react_1.useCallback)((theme) => {
        setThemeState(theme);
        // Save to storage
        try {
            localStorage.setItem(storageKey, theme);
        }
        catch (e) {
            // Unsupported
        }
    }, [forcedTheme]);
    const handleMediaQuery = (0, react_1.useCallback)((e) => {
        const resolved = getSystemTheme(e);
        setResolvedTheme(resolved);
        if (theme === "system" && enableSystem && !forcedTheme) {
            applyTheme("system");
        }
    }, [theme, forcedTheme]);
    // Always listen to System preference
    (0, react_1.useEffect)(() => {
        const media = window.matchMedia(MEDIA);
        // Intentionally use deprecated listener methods to support iOS & old browsers
        media.addListener(handleMediaQuery);
        handleMediaQuery(media);
        return () => media.removeListener(handleMediaQuery);
    }, [handleMediaQuery]);
    // localStorage event handling
    (0, react_1.useEffect)(() => {
        const handleStorage = (e) => {
            if (e.key !== storageKey) {
                return;
            }
            // If default theme set, use it if localstorage === null (happens on local storage manual deletion)
            const theme = e.newValue || defaultTheme;
            setTheme(theme);
        };
        window.addEventListener("storage", handleStorage);
        return () => window.removeEventListener("storage", handleStorage);
    }, [setTheme]);
    // Whenever theme or forcedTheme changes, apply it
    (0, react_1.useEffect)(() => {
        applyTheme(forcedTheme !== null && forcedTheme !== void 0 ? forcedTheme : theme);
    }, [forcedTheme, theme]);
    const providerValue = (0, react_1.useMemo)(() => ({
        theme,
        setTheme,
        forcedTheme,
        resolvedTheme: theme === "system" ? resolvedTheme : theme,
        themes: enableSystem ? [...themes, "system"] : themes,
        systemTheme: (enableSystem ? resolvedTheme : undefined),
    }), [theme, setTheme, forcedTheme, resolvedTheme, enableSystem, themes]);
    return (<ThemeContext.Provider value={providerValue}>
      <ThemeScript {...{
        forcedTheme,
        disableTransitionOnChange,
        enableSystem,
        enableColorScheme,
        storageKey,
        themes,
        defaultTheme,
        attribute,
        value,
        children,
        attrs,
        nonce,
    }}/>
      {children}
    </ThemeContext.Provider>);
};
const ThemeScript = (0, react_1.memo)(({ forcedTheme, storageKey, attribute, enableSystem, enableColorScheme, defaultTheme, value, attrs, nonce, }) => {
    const defaultSystem = defaultTheme === "system";
    // Code-golfing the amount of characters in the script
    const optimization = (() => {
        if (attribute === "class") {
            const removeClasses = `c.remove(${attrs
                .map((t) => `'${t}'`)
                .join(",")})`;
            return `var d=document.documentElement,c=d.classList;${removeClasses};`;
        }
        else {
            return `var d=document.documentElement,n='${attribute}',s='setAttribute';`;
        }
    })();
    const fallbackColorScheme = (() => {
        if (!enableColorScheme) {
            return "";
        }
        const fallback = colorSchemes.includes(defaultTheme)
            ? defaultTheme
            : null;
        if (fallback) {
            return `if(e==='light'||e==='dark'||!e)d.style.colorScheme=e||'${defaultTheme}'`;
        }
        else {
            return `if(e==='light'||e==='dark')d.style.colorScheme=e`;
        }
    })();
    const updateDOM = (name, literal = false, setColorScheme = true) => {
        const resolvedName = value ? value[name] : name;
        const val = literal ? name + `|| ''` : `'${resolvedName}'`;
        let text = "";
        // MUCH faster to set colorScheme alongside HTML attribute/class
        // as it only incurs 1 style recalculation rather than 2
        // This can save over 250ms of work for pages with big DOM
        if (enableColorScheme &&
            setColorScheme &&
            !literal &&
            colorSchemes.includes(name)) {
            text += `d.style.colorScheme = '${name}';`;
        }
        if (attribute === "class") {
            if (literal || resolvedName) {
                text += `c.add(${val})`;
            }
            else {
                text += `null`;
            }
        }
        else {
            if (resolvedName) {
                text += `d[s](n,${val})`;
            }
        }
        return text;
    };
    const scriptSrc = (() => {
        if (forcedTheme) {
            return `!function(){${optimization}${updateDOM(forcedTheme)}}()`;
        }
        if (enableSystem) {
            return `!function(){try{${optimization}var e=localStorage.getItem('${storageKey}');if('system'===e||(!e&&${defaultSystem})){var t='${MEDIA}',m=window.matchMedia(t);if(m.media!==t||m.matches){${updateDOM("dark")}}else{${updateDOM("light")}}}else if(e){${value ? `var x=${JSON.stringify(value)};` : ""}${updateDOM(value ? `x[e]` : "e", true)}}${!defaultSystem
                ? `else{` + updateDOM(defaultTheme, false, false) + "}"
                : ""}${fallbackColorScheme}}catch(e){}}()`;
        }
        return `!function(){try{${optimization}var e=localStorage.getItem('${storageKey}');if(e){${value ? `var x=${JSON.stringify(value)};` : ""}${updateDOM(value ? `x[e]` : "e", true)}}else{${updateDOM(defaultTheme, false, false)};}${fallbackColorScheme}}catch(t){}}();`;
    })();
    return (<script nonce={nonce} dangerouslySetInnerHTML={{ __html: scriptSrc }}/>);
}, 
// Never re-render this component
() => true);
// Helpers
const getTheme = (key, fallback) => {
    if (isServer)
        return undefined;
    let theme;
    try {
        theme = localStorage.getItem(key) || undefined;
    }
    catch (e) {
        // Unsupported
    }
    return theme || fallback;
};
const disableAnimation = () => {
    const css = document.createElement("style");
    css.appendChild(document.createTextNode(`*{-webkit-transition:none!important;-moz-transition:none!important;-o-transition:none!important;-ms-transition:none!important;transition:none!important}`));
    document.head.appendChild(css);
    return () => {
        // Force restyle
        (() => window.getComputedStyle(document.body))();
        // Wait for next tick before removing
        setTimeout(() => {
            document.head.removeChild(css);
        }, 1);
    };
};
const getSystemTheme = (e) => {
    if (!e)
        e = window.matchMedia(MEDIA);
    const isDark = e.matches;
    const systemTheme = isDark ? "dark" : "light";
    return systemTheme;
};
//# sourceMappingURL=index.jsx.map