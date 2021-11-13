const puppeteer = require('puppeteer');
const fetch = require('node-fetch');
const nodeHtmlToImage = require('node-html-to-image');
require('dotenv').config();

// function parseCookie(str) {
//   return str
//     .split(';')
//     .map(v => v.split('='))
//     .reduce((acc, v) => {
//       acc[decodeURIComponent(v[0].trim())] = decodeURIComponent(v[1].trim());
//       return acc;
//     }, {});
// }

// function serializeCookie(cookie) {
//   return Object.keys(cookie).map(key => `${encodeURIComponent(key)}=${encodeURIComponent(cookie[key])}`).join('; ');
// }

function serializeCookie(cookie) {
  return cookie.map(entry => `${encodeURIComponent(entry.name)}=${encodeURIComponent(entry.value)}`).join('; ');
}

// function updateCookie(cookie, str) {
//   // console.log(str);
//   if (str === null) return cookie;
//   for (let pair of str.split(',')) {
//     let [key, value] = pair.split(';')[0].split('=');
//     if (key[0] === ' ') key = key.substring(1);
//     if (!value) delete cookie[key];
//     else cookie[key] = value;
//   }
//   return cookie;
// }

function updateCookie(cookie, str) {
  console.log(str);
  if (str === null) return cookie;
  // console.log(str);
  for (let pair of str.split(/, */)) {
    console.log(pair);
    let [namevalue, ...args] = pair.split(/; */);
    let [name, value] = namevalue.split('=');
    // if (name[0] === ' ') name = name.substring(1);
    if (!value) console.log(pair);
    // if (!value) delete cookie[key];
    // else cookie[key] = value;
    // console.log(str);
    let entry = cookie.find(entry => entry.name === name);
    if (!entry) cookie.push(entry = { name });
    entry.value = value;
    for (let arg of args) {
      let [k, v] = arg.split('=');
      entry[k] = (v === undefined) ? true : v;
    }
    Object.assign(entry, {
      domain: entry.domain || 'studenthealthoc.sa.ucsb.edu'
    })
  }
  cookie.sort((a, b) => (a.name > b.name) ? 1 : (a.name < b.name) ? -1 : 0);
  console.log(cookie);
  return cookie;
}

const inputReg = /<input.*?\Wname="(.*?)".*?\Wvalue="(.*?)".*?\/>/gm;

function getForm(html, options = {}) {
  let form = {};
  let selected = html;
  if (options.id) selected = html.match(new RegExp(`<form.*?\Wid="${options.id}".*?>([\s\S]*?)<\/form>`))[1];
  for (let match of selected.matchAll(inputReg)) {
    // console.log(match[0]);
    form[match[1]] = match[2];
  }
  if (options.entries) {
    for (let key in options.entries) {
      if (!options.entries[key]) delete form[key];
      else form[key] = options.entries[key];
    }
  }
  console.log(form);
  return form;
}

(async () => {
  const browser = await puppeteer.launch({headless: true});
  console.log('Opening puppeteer...');
  var page = await browser.newPage();
  console.log('Signing in (Step 1)...');
  await page.goto('https://studenthealthoc.sa.ucsb.edu/login_dualauthentication.aspx');
  await page.click('#cmdStudentDualAuthentication');
  // await new Promise(resolve => setTimeout(resolve, 500));
  try {
    await page.waitForNavigation({ waitUntil: 'domcontentloaded' });
  } catch (e) {
    console.error(e);
  }
  console.log('Signing in (Step 2)...');
  // console.log(1);
  await page.type('#txtUsername', process.env.UCSBNETID);
  await page.type('#txtPassWord', process.env.PASSWORD);
  await page.click('#cmdStandardProceed');
  // await new Promise(resolve => setTimeout(resolve, 500));
  try {
    await page.waitForNavigation({ waitUntil: 'domcontentloaded' });
  } catch (e) {
    console.error(e);
  }
  // console.log(2);
  // await page.goto('https://studenthealthoc.sa.ucsb.edu/Mvc/Patients/QuarantineSurvey');
  // await page.click('a[href="/Mvc/Patients/QuarantineSurvey"]');
  await page.close();
  console.log('Opening survey (Step 1)...');
  page = await browser.newPage();
  await page.goto('https://studenthealthoc.sa.ucsb.edu/Mvc/Patients/QuarantineSurvey');
  // console.log("0");
  // await page.waitForNavigation({ waitUntil: 'load' });
  // await page.waitForNavigation(/*{ waitUntil: 'networkidle0' }*/);
  // console.log("1");
  await page.close();
  console.log('Opening survey (Step 2)...');
  page = await browser.newPage();
  await page.goto('https://studenthealthoc.sa.ucsb.edu/CheckIn/Survey/ShowAll/24');
  // await page.click('a[href="/CheckIn/Survey/ShowAll/24"]')
  // await page.waitForNavigation({ waitUntil: 'load' });
  // console.log("2");
  // await new Promise((resolve) => setTimeout(resolve, 5000));
  console.log('Completing survey...');
  await page.$$eval('input[name$="AnswerID"][value="2"]', elements => elements.forEach(e => e.click()));
  // console.log("3");
  // await page.evaluate(() => { submitSurvey() });
  console.log('Submitting survey...');
  // await page.click('input[onclick="submitSurvey()"]');
  await page.evaluate(_ => { submitSurvey() });
  await page.waitForNavigation({ waitUntil: 'networkidle0' });

  console.log('Closing browser...');
  await browser.close();
  console.log('Done!');

  // let cookie = [];
  // let login_dualauthentication = await fetch("https://studenthealthoc.sa.ucsb.edu/login_dualauthentication.aspx", {
  //   "credentials": "include",
  //   "headers": {
  //     "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:91.0) Gecko/20100101 Firefox/91.0",
  //     "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
  //     "Accept-Language": "en-US,en;q=0.5",
  //     "Upgrade-Insecure-Requests": "1",
  //     "Sec-Fetch-Dest": "document",
  //     "Sec-Fetch-Mode": "navigate",
  //     "Sec-Fetch-Site": "none",
  //     "Sec-Fetch-User": "?1",
  //     "Cache-Control": "max-age=0"
  //   },
  //   "method": "GET",
  //   "mode": "cors"
  // });
  // updateCookie(cookie, login_dualauthentication.headers.get('set-cookie'));
  // // console.log(login_dualauthentication);
  // // console.log(`login_dualauthentication: ${await login_dualauthentication.clone().text()}`);
  // // console.log(serializeCookie(cookie));
  // // let cmdAuthorizedRep
  // let login_dualauthentication_post = await fetch("https://studenthealthoc.sa.ucsb.edu/login_dualauthentication.aspx", {
  //   "credentials": "include",
  //   "headers": {
  //     "cookie": serializeCookie(cookie),
  //     "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:91.0) Gecko/20100101 Firefox/91.0",
  //     "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
  //     "Accept-Language": "en-US,en;q=0.5",
  //     "Content-Type": "application/x-www-form-urlencoded",
  //     "Upgrade-Insecure-Requests": "1",
  //     "Sec-Fetch-Dest": "document",
  //     "Sec-Fetch-Mode": "navigate",
  //     "Sec-Fetch-Site": "same-origin",
  //     "Sec-Fetch-User": "?1"
  //   },
  //   "referrer": "https://studenthealthoc.sa.ucsb.edu/login_dualauthentication.aspx",
  //   "body": new URLSearchParams(getForm(await login_dualauthentication.text(), {
  //     entries: {
  //       "cmdAuthorizedRep": false
  //     },
  //   })).toString(),
  //   "method": "POST",
  //   "mode": "cors"
  // });
  // updateCookie(cookie, login_dualauthentication_post.headers.get('set-cookie'));
  // // console.log(login_dualauthentication_post);
  // // console.log(`login_dualauthentication_post: ${await login_dualauthentication_post.clone().text()}`);
  // let login_directory = await fetch("https://studenthealthoc.sa.ucsb.edu/login_directory.aspx", {
  //   "credentials": "include",
  //   "headers": {
  //     "cookie": serializeCookie(cookie),
  //     "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:92.0) Gecko/20100101 Firefox/92.0",
  //     "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
  //     "Accept-Language": "en-US,en;q=0.5",
  //     "Upgrade-Insecure-Requests": "1",
  //     "Sec-Fetch-Dest": "document",
  //     "Sec-Fetch-Mode": "navigate",
  //     "Sec-Fetch-Site": "same-origin",
  //     "Sec-Fetch-User": "?1"
  //   },
  //   "referrer": "https://studenthealthoc.sa.ucsb.edu/login_dualauthentication.aspx",
  //   "method": "GET",
  //   "mode": "cors"
  // });
  // updateCookie(cookie, login_directory.headers.get('set-cookie'));
  // // console.log(await login_directory.text());
  //
  // // console.log(`login_directory: ${await login_directory.text()}`);
  // let login_directory_post = await fetch("https://studenthealthoc.sa.ucsb.edu/login_directory.aspx", {
  //   "credentials": "include",
  //   "headers": {
  //     "cookie": serializeCookie(cookie),
  //     "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:92.0) Gecko/20100101 Firefox/92.0",
  //     "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
  //     "Accept-Language": "en-US,en;q=0.5",
  //     "Content-Type": "application/x-www-form-urlencoded",
  //     "Upgrade-Insecure-Requests": "1",
  //     "Sec-Fetch-Dest": "document",
  //     "Sec-Fetch-Mode": "navigate",
  //     "Sec-Fetch-Site": "same-origin",
  //     "Sec-Fetch-User": "?1"
  //   },
  //   "referrer": "https://studenthealthoc.sa.ucsb.edu/login_directory.aspx",
  //   "body": new URLSearchParams(getForm(await login_directory.text(), {
  //     entries: {
  //       txtUsername: process.env.UCSBNETID,
  //       txtPassWord: process.env.PASSWORD,
  //       cmdStandardCancel: false
  //     }
  //   })).toString(),
  //   "method": "POST",
  //   "mode": "cors"
  // });
  // // console.log(`login_directory_post: ${await login_directory_post.text()}`);
  // console.log('-----------------------------',login_directory_post.headers.get('set-cookie'));
  // updateCookie(cookie, login_directory_post.headers.get('set-cookie'));
  // let home = await fetch("https://studenthealthoc.sa.ucsb.edu/home.aspx", {
  //   // "credentials": "include",
  //   "headers": {
  //     "cookie": serializeCookie(cookie),
  //     "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:92.0) Gecko/20100101 Firefox/92.0",
  //     "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
  //     "Accept-Language": "en-US,en;q=0.5",
  //     "Upgrade-Insecure-Requests": "1",
  //     "Sec-Fetch-Dest": "document",
  //     "Sec-Fetch-Mode": "navigate",
  //     "Sec-Fetch-Site": "same-origin",
  //     "Sec-Fetch-User": "?1"
  //   },
  //   "referrer": "https://studenthealthoc.sa.ucsb.edu/login_directory.aspx",
  //   "method": "GET",
  //   "mode": "cors"
  // });
  // cookie.push({name: "localTimeZoneOffset", value: "-420"});
  // updateCookie(cookie, home.headers.get('set-cookie'));
  // console.log(serializeCookie(cookie));
  // // let home_text = await home.text();
  // // console.log(`home: ${home_text}`);
  // let QuarantineSurvey = await fetch("https://studenthealthoc.sa.ucsb.edu/Mvc/Patients/QuarantineSurvey", {
  //   // "credentials": "include",
  //   "headers": {
  //     "cookie": serializeCookie(cookie),
  //     "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:92.0) Gecko/20100101 Firefox/92.0",
  //     "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
  //     "Accept-Language": "en-US,en;q=0.5",
  //     "Upgrade-Insecure-Requests": "1",
  //     "Sec-Fetch-Dest": "document",
  //     "Sec-Fetch-Mode": "navigate",
  //     "Sec-Fetch-Site": "same-origin",
  //     "Sec-Fetch-User": "?1"
  //   },
  //   "referrer": "https://studenthealthoc.sa.ucsb.edu/home.aspx",
  //   "method": "GET",
  //   "mode": "cors"
  // });
  // updateCookie(QuarantineSurvey, home.headers.get('set-cookie'));
  // console.log(`QuarantineSurvey: ${await QuarantineSurvey.text()}`);
  // let Intro = await fetch("https://studenthealthoc.sa.ucsb.edu/CheckIn/Survey/Intro/24", {
  //   "credentials": "include",
  //   "headers": {
  //     "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:92.0) Gecko/20100101 Firefox/92.0",
  //     "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
  //     "Accept-Language": "en-US,en;q=0.5",
  //     "Upgrade-Insecure-Requests": "1",
  //     "Sec-Fetch-Dest": "document",
  //     "Sec-Fetch-Mode": "navigate",
  //     "Sec-Fetch-Site": "same-origin",
  //     "Sec-Fetch-User": "?1"
  //   },
  //   "referrer": "https://studenthealthoc.sa.ucsb.edu/home.aspx",
  //   "method": "GET",
  //   "mode": "cors"
  // });
  // // console.log(cookie);
  // console.log(`Intro: ${await Intro.text()}`);
  // let survey = await fetch("https://studenthealthoc.sa.ucsb.edu/CheckIn/Survey/ShowAll/24", {
  //   // "credentials": "include",
  //   "headers": {
  //     "cookie": serializeCookie(cookie),
  //     "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:92.0) Gecko/20100101 Firefox/92.0",
  //     "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
  //     "Accept-Language": "en-US,en;q=0.5",
  //     "Upgrade-Insecure-Requests": "1",
  //     "Sec-Fetch-Dest": "document",
  //     "Sec-Fetch-Mode": "navigate",
  //     "Sec-Fetch-Site": "none",
  //     "Sec-Fetch-User": "?1"
  //   },
  //   "method": "GET",
  //   "mode": "cors"
  // });
  // updateCookie(survey, home.headers.get('set-cookie'));
  // console.log(`survey: ${await survey.text()}`);
  // let survey_post = await fetch("https://studenthealthoc.sa.ucsb.edu/CheckIn/Survey/ShowAll/24", {
  //   "credentials": "include",
  //   "headers": {
  //     "cookie": serializeCookie(cookie),
  //     "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:92.0) Gecko/20100101 Firefox/92.0",
  //     "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
  //     "Accept-Language": "en-US,en;q=0.5",
  //     "Content-Type": "application/x-www-form-urlencoded",
  //     "Upgrade-Insecure-Requests": "1",
  //     "Sec-Fetch-Dest": "document",
  //     "Sec-Fetch-Mode": "navigate",
  //     "Sec-Fetch-Site": "same-origin",
  //     "Sec-Fetch-User": "?1"
  //   },
  //   "referrer": "https://studenthealthoc.sa.ucsb.edu/CheckIn/Survey/ShowAll/24",
  //   "body": new URLSearchParams(getForm(await survey.text(), {
  //     entries: {
  //       "AllQuestions[0].AnswerID": "2",
  //       "AllQuestions[1].AnswerID": "2",
  //       "AllQuestions[2].AnswerID": "2",
  //       "AllQuestions[3].AnswerID": "2",
  //       "AllQuestions[4].AnswerID": "2"
  //     }
  //   })).toString(),
  //   "method": "POST",
  //   "mode": "cors"
  // });
  // updateCookie(cookie, survey_post.headers.get('set-cookie'));
  // let SurveyFormsHome = await fetch("https://studenthealthoc.sa.ucsb.edu/SurveyFormsHome.aspx?success=1", {
  //   "credentials": "include",
  //   "headers": {
  //     "cookie": serializeCookie(cookie),
  //     "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:92.0) Gecko/20100101 Firefox/92.0",
  //     "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
  //     "Accept-Language": "en-US,en;q=0.5",
  //     "Upgrade-Insecure-Requests": "1",
  //     "Sec-Fetch-Dest": "document",
  //     "Sec-Fetch-Mode": "navigate",
  //     "Sec-Fetch-Site": "same-origin",
  //     "Sec-Fetch-User": "?1"
  //   },
  //   "referrer": "https://studenthealthoc.sa.ucsb.edu/CheckIn/Survey/ShowAll/24",
  //   "method": "GET",
  //   "mode": "cors"
  // });
  // updateCookie(cookie, SurveyFormsHome.headers.get('set-cookie'));
  // // console.log(serializeCookie(cookie));
  // // console.log(cookie);
  // // const browser = await puppeteer.launch({headless: false});
  // // // browser.set
  // // let page = await browser.newPage();
  // // await page.setCookie(...cookie);
  // // await page.goto('https://studenthealthoc.sa.ucsb.edu/CheckIn/Survey/ShowAll/24');
  // // await page.setCookie(...Object.keys(cookie).map(key => ({name:key,value:(cookie)[key]})));
  // // await page.goto('https://studenthealthoc.sa.ucsb.edu/CheckIn/Survey/ShowAll/24');
  // // console.log(await survey_post.text());
  // let SurveyFormsHome_text = await SurveyFormsHome.text();
  // let Activity_post = await fetch("https://studenthealthoc.sa.ucsb.edu/Mvc/Activity", {
  //   "credentials": "include",
  //   "headers": {
  //     "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:92.0) Gecko/20100101 Firefox/92.0",
  //     "Accept": "*/*",
  //     "Accept-Language": "en-US,en;q=0.5",
  //     "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
  //     "X-Requested-With": "XMLHttpRequest",
  //     "Sec-Fetch-Dest": "empty",
  //     "Sec-Fetch-Mode": "cors",
  //     "Sec-Fetch-Site": "same-origin"
  //   },
  //   "referrer": "https://studenthealthoc.sa.ucsb.edu/home.aspx",
  //   "body": new URLSearchParams({
  //     "LogType": "CLICK",
  //     "LogMessage:": `Location=/SurveyFormsHome.aspx;+Target=<i+class="fa+fa-close"></i>`,
  //     "__RequestVerificationToken": SurveyFormsHome_text.match(/<input.*?\Wname="__RequestVerificationToken".*?\Wvalue="(.*?)".*?\/>/)[1]
  //   }),
  //   "method": "POST",
  //   "mode": "cors"
  // });
  // console.log(SurveyFormsHome_text.match(/<input.*?\Wname="__RequestVerificationToken".*?\Wvalue="(.*?)".*?\/>/)[1]);
  // updateCookie(cookie, Activity_post.headers.get('set-cookie'));
  // let badge = await (await fetch("https://studenthealthoc.sa.ucsb.edu/Mvc/Patients/QuarantineBadge", {
  //   "credentials": "include",
  //   "headers": {
  //     "cookie": serializeCookie(cookie),
  //     "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:92.0) Gecko/20100101 Firefox/92.0",
  //     "Accept": "*/*",
  //     "Accept-Language": "en-US,en;q=0.5",
  //     "X-Requested-With": "XMLHttpRequest",
  //     "Sec-Fetch-Dest": "empty",
  //     "Sec-Fetch-Mode": "cors",
  //     "Sec-Fetch-Site": "same-origin"
  //   },
  //   "referrer": "https://studenthealthoc.sa.ucsb.edu/home.aspx",
  //   "method": "GET",
  //   "mode": "cors"
  // })).text();
  // let html = SurveyFormsHome_text.replace(/(<body.*?>).*?<\/body>/, `$1${badge}</body>`);
  // // console.log(html);
  // await nodeHtmlToImage({
  //   output: './image.png',
  //   html
  // });
  // const browser = await puppeteer.launch({headless: false});
  // // browser.set
  // let page = await browser.newPage();
  // await page.setCookie(...cookie);
  // await page.goto('https://studenthealthoc.sa.ucsb.edu/home.aspx');
})();