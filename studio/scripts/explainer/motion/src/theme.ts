import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";


/*
 * Geist (SIL OFL, public/fonts/OFL.txt), bundled as a variable font rather than
 * fetched from Google Fonts, so a render needs no network and always matches the site's type.
 */
export const fontFamily = "Geist";
loadFont({ family: fontFamily, url: staticFile("fonts/Geist-Variable.woff2"), weight: "100 900" });
