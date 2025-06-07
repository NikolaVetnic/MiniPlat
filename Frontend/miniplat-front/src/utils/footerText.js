import sr from "../locales/sr.json";

const year = new Date().getFullYear();
const title = sr.captions.title;
const company = sr.captions.companyName;

const footerText = `© ${year} - ${title}. ${company}`;

export default footerText;
