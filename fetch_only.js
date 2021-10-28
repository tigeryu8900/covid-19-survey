const fetch = require('node-fetch');
require('dotenv').config();

function serializeCookie(cookie) {
  return cookie.map(entry => `${encodeURIComponent(entry.name)}=${encodeURIComponent(entry.value)}`).join('; ');
}

function updateCookie(cookie, str) {
  // console.log(str);
  if (str === null) return cookie;
  // console.log(str);
  for (let pair of str.split(/, */)) {
    // console.log(pair);
    let [namevalue, ...args] = pair.split(/; */);
    let [name, value] = namevalue.split('=');
    // if (name[0] === ' ') name = name.substring(1);
    // if (!value) console.log(pair);
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
  // console.log(cookie);
  return cookie;
}

const inputReg = /<input.*?\Wname="(.*?)".*?\Wvalue="(.*?)".*?\/>/gm;

function getForm(html, options = {}) {
  let form = {};
  let selected = html;
  if (options.id) selected = html.match(new RegExp(`<form.*?\\Wid="${options.id}".*?>([\\s\\S]*?)<\\/form>`))[1];
  // if (options.verbose) console.log(selected);
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
  // console.log(form);
  return form;
}

(async () => {
  let cookie = [
    {name: 'localTimeZoneOffset', value: (new Date().getTimezoneOffset() * -1).toString()},
    {name: '.OpenCommunicator', value: '0FF2FEA06D901C7ACF17AA311DFE20DB37E9B91ADBCA489BF1C1CD0BBFB9E87A304D8D1E854948C70FD66332B2A8FE95265AFCCF323F9B658C5BA9DB19590DB740940BD8DF8730A6680FC6069616062CA99523978127F00E4CE7A9B6A39104E1'}
  ];
  let login_dualauthentication = await fetch("https://studenthealthoc.sa.ucsb.edu/login_dualauthentication.aspx", {
    "method": "GET"
  });
  updateCookie(cookie, login_dualauthentication.headers.get('set-cookie'));
  // console.log(login_dualauthentication);
  // console.log(`login_dualauthentication: ${await login_dualauthentication.clone().text()}`);
  // console.log(serializeCookie(cookie));
  // let cmdAuthorizedRep
  let login_dualauthentication_post = await fetch("https://studenthealthoc.sa.ucsb.edu/login_dualauthentication.aspx", {
    "headers": {
      "cookie": serializeCookie(cookie),
      "Content-Type": "application/x-www-form-urlencoded"
    },
    "body": new URLSearchParams(getForm(await login_dualauthentication.text(), {
      entries: {
        "cmdAuthorizedRep": false
      },
    })).toString(),
    "method": "POST"
  });
  updateCookie(cookie, login_dualauthentication_post.headers.get('set-cookie'));
  let login_directory_post = await fetch("https://studenthealthoc.sa.ucsb.edu/login_directory.aspx", {
    "headers": {
      "cookie": serializeCookie(cookie),
      "Content-Type": "application/x-www-form-urlencoded"
    },
    "body": new URLSearchParams(getForm(await login_dualauthentication_post.text(), {id: 'ctl03', verbose: true, entries: {
        txtUsername: process.env.UCSBNETID,
        txtPassWord: process.env.PASSWORD,
        cmdStandardCancel: false
      }})).toString(),
    "method": "POST"
  });
  // console.log(`login_directory_post: ${await login_directory_post.text()}`);
  // console.log('-----------------------------',login_directory_post.headers.get('set-cookie'));
  // await fetch("https://studenthealthoc.sa.ucsb.edu/Mvc/Patients/Todo", {
  //   headers: {
  //     cookie: serializeCookie(cookie)
  //   }
  // });
  // console.log(cookie);
  // return;
  updateCookie(cookie, login_directory_post.headers.get('set-cookie'));
  let QuarantineSurvey = await fetch("https://studenthealthoc.sa.ucsb.edu/Mvc/Patients/QuarantineSurvey", {
    "headers": {
      "cookie": serializeCookie(cookie),
    },
    "method": "GET"
  });
  updateCookie(QuarantineSurvey, QuarantineSurvey.headers.get('set-cookie'));
  // console.log(`QuarantineSurvey: ${await QuarantineSurvey.text()}`);
  // return;
  // console.log(await (await fetch("https://studenthealthoc.sa.ucsb.edu/home.aspx", {
  //   "credentials": "include",
  //   "headers": {
  //     "cookie": serializeCookie(cookie),
  //   },
  //   "referrer": "https://studenthealthoc.sa.ucsb.edu/login_directory.aspx",
  //   "method": "GET",
  //   // "mode": "cors"
  // })).text());
  // return;
  // let Intro = await fetch("https://studenthealthoc.sa.ucsb.edu/CheckIn/Survey/Intro/24", {
  //   "headers": {
  //     cookie: serializeCookie(cookie)
  //   },
  //   "method": "GET"
  // });
  // console.log(cookie);
  // console.log(`Intro: ${await Intro.text()}`);
  // return;
  let survey = await fetch("https://studenthealthoc.sa.ucsb.edu/CheckIn/Survey/ShowAll/24", {
    // "credentials": "include",
    "headers": {
      "cookie": serializeCookie(cookie),
      // "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:92.0) Gecko/20100101 Firefox/92.0",
      // "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      // "Accept-Language": "en-US,en;q=0.5",
      // "Upgrade-Insecure-Requests": "1",
      // "Sec-Fetch-Dest": "document",
      // "Sec-Fetch-Mode": "navigate",
      // "Sec-Fetch-Site": "none",
      // "Sec-Fetch-User": "?1"
    },
    "method": "GET",
    // "mode": "cors"
  });
  updateCookie(survey, survey.headers.get('set-cookie'));
  // console.log(`survey: ${await survey.text()}`);
  // return;
  let survey_post = await fetch("https://studenthealthoc.sa.ucsb.edu/CheckIn/Survey/ShowAll/24", {
    // "credentials": "include",
    "headers": {
      "cookie": serializeCookie(cookie),
      // "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:92.0) Gecko/20100101 Firefox/92.0",
      // "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      // "Accept-Language": "en-US,en;q=0.5",
      // "Content-Type": "application/x-www-form-urlencoded",
      // "Upgrade-Insecure-Requests": "1",
      // "Sec-Fetch-Dest": "document",
      // "Sec-Fetch-Mode": "navigate",
      // "Sec-Fetch-Site": "same-origin",
      // "Sec-Fetch-User": "?1"
    },
    // "referrer": "https://studenthealthoc.sa.ucsb.edu/CheckIn/Survey/ShowAll/24",
    "body": new URLSearchParams(getForm(await survey.text(), {
      entries: {
        "AllQuestions[0].AnswerID": "2",
        "AllQuestions[1].AnswerID": "2",
        "AllQuestions[2].AnswerID": "2",
        "AllQuestions[3].AnswerID": "2",
        "AllQuestions[4].AnswerID": "2"
      }
    })).toString(),
    "method": "POST",
    // "mode": "cors"
  });
  updateCookie(cookie, survey_post.headers.get('set-cookie'));
  console.log(`survey_post: ${await survey_post.text()}`);
  return;
  let SurveyFormsHome = await fetch("https://studenthealthoc.sa.ucsb.edu/SurveyFormsHome.aspx?success=1", {
    "credentials": "include",
    "headers": {
      "cookie": serializeCookie(cookie),
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:92.0) Gecko/20100101 Firefox/92.0",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.5",
      "Upgrade-Insecure-Requests": "1",
      "Sec-Fetch-Dest": "document",
      "Sec-Fetch-Mode": "navigate",
      "Sec-Fetch-Site": "same-origin",
      "Sec-Fetch-User": "?1"
    },
    "referrer": "https://studenthealthoc.sa.ucsb.edu/CheckIn/Survey/ShowAll/24",
    "method": "GET",
    "mode": "cors"
  });
  updateCookie(cookie, SurveyFormsHome.headers.get('set-cookie'));
  // console.log(serializeCookie(cookie));
  // console.log(cookie);
  // const browser = await puppeteer.launch({headless: false});
  // // browser.set
  // let page = await browser.newPage();
  // await page.setCookie(...cookie);
  // await page.goto('https://studenthealthoc.sa.ucsb.edu/CheckIn/Survey/ShowAll/24');
  // await page.setCookie(...Object.keys(cookie).map(key => ({name:key,value:(cookie)[key]})));
  // await page.goto('https://studenthealthoc.sa.ucsb.edu/CheckIn/Survey/ShowAll/24');
  // console.log(await survey_post.text());
  let SurveyFormsHome_text = await SurveyFormsHome.text();
  let Activity_post = await fetch("https://studenthealthoc.sa.ucsb.edu/Mvc/Activity", {
    "credentials": "include",
    "headers": {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:92.0) Gecko/20100101 Firefox/92.0",
      "Accept": "*/*",
      "Accept-Language": "en-US,en;q=0.5",
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      "X-Requested-With": "XMLHttpRequest",
      "Sec-Fetch-Dest": "empty",
      "Sec-Fetch-Mode": "cors",
      "Sec-Fetch-Site": "same-origin"
    },
    "referrer": "https://studenthealthoc.sa.ucsb.edu/home.aspx",
    "body": new URLSearchParams({
      "LogType": "CLICK",
      "LogMessage:": `Location=/SurveyFormsHome.aspx;+Target=<i+class="fa+fa-close"></i>`,
      "__RequestVerificationToken": SurveyFormsHome_text.match(/<input.*?\Wname="__RequestVerificationToken".*?\Wvalue="(.*?)".*?\/>/)[1]
    }),
    "method": "POST",
    "mode": "cors"
  });
  console.log(SurveyFormsHome_text.match(/<input.*?\Wname="__RequestVerificationToken".*?\Wvalue="(.*?)".*?\/>/)[1]);
  updateCookie(cookie, Activity_post.headers.get('set-cookie'));
  let badge = await (await fetch("https://studenthealthoc.sa.ucsb.edu/Mvc/Patients/QuarantineBadge", {
    "credentials": "include",
    "headers": {
      "cookie": serializeCookie(cookie),
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:92.0) Gecko/20100101 Firefox/92.0",
      "Accept": "*/*",
      "Accept-Language": "en-US,en;q=0.5",
      "X-Requested-With": "XMLHttpRequest",
      "Sec-Fetch-Dest": "empty",
      "Sec-Fetch-Mode": "cors",
      "Sec-Fetch-Site": "same-origin"
    },
    "referrer": "https://studenthealthoc.sa.ucsb.edu/home.aspx",
    "method": "GET",
    "mode": "cors"
  })).text();
  let html = SurveyFormsHome_text.replace(/(<body.*?>).*?<\/body>/, `$1${badge}</body>`);
  // console.log(html);
  await nodeHtmlToImage({
    output: './image.png',
    html
  });
  const browser = await puppeteer.launch({headless: false});
  // browser.set
  let page = await browser.newPage();
  await page.setCookie(...cookie);
  await page.goto('https://studenthealthoc.sa.ucsb.edu/home.aspx');
})();