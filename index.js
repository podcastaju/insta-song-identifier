// Import necessary modules
const { Builder, By, until } = require("selenium-webdriver");
const path = require("path");
const axios = require("axios");
const fs = require("fs");
const puppeteer = require("puppeteer");
const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path; // Add this line
const ffmpeg = require("fluent-ffmpeg");
const express = require("express");
const TelegramBot = require("node-telegram-bot-api");
const app = express();
require("dotenv").config();

const token = "6653608319:AAE0Ehdj_cDJVwLdaNds5dNxKAisrqrskFM"; // Replace with your bot's API token
const bot = new TelegramBot(token, { polling: true });

// Set the path to the ffmpeg executable
// ffmpeg.setFfmpegPath(ffmpegPath);
// puppeteer start longer
// async function downloadInstagramReel(url, outputFilePath, chatId) {
//   try {
//     const browser = await puppeteer.launch({
//       args: [
//         "--disable-setuid-sandbox",
//         "--no-sandbox",
//         "--single-process",
//         "--no-zygote",
//       ],
//       executablePath:
//         process.env.NODE_ENV === "production"
//           ? process.env.PUPPETEER_EXECUTABLE_PATH
//           : puppeteer.executablePath(),
//     });
//     const page = await browser.newPage();
//     await page.setDefaultNavigationTimeout(120000);
//     await page.goto(url, { waitUntil: "networkidle0" });

//     // Wait for the video to load
//     await page.waitForSelector("video", { timeout: 120000 });

//     const videoUrl = await page.evaluate(() => {
//       const videoElement = document.querySelector("video");
//       return videoElement ? videoElement.src : null;
//     });

//     if (videoUrl) {
//       const videoResponse = await axios.get(videoUrl, {
//         responseType: "stream",
//       });
//       const videoStream = videoResponse.data;

//       const videoFilePath = "temp_video.mp4"; // Temporary video file
//       const fileStream = fs.createWriteStream(videoFilePath);
//       videoStream.pipe(fileStream);

//       await new Promise((resolve) => {
//         fileStream.on("finish", resolve);
//       });

//       // Convert the video to MP3
//       const mp3FilePath = outputFilePath;
//       ffmpeg()
//         .input(videoFilePath)
//         .audioCodec("libmp3lame")
//         .toFormat("mp3")
//         .on("end", () => {
//           console.log("Reel converted to MP3 successfully.");
//           fs.unlinkSync(videoFilePath); // Remove the temporary video file
//           // Now that the MP3 file is ready, call the openWebsite function
//           openWebsite(mp3FilePath, chatId);
//         })
//         .on("error", (err) => {
//           console.error("Error converting to MP3:", err);
//         })
//         .save(mp3FilePath);
//     } else {
//       console.error("Video URL not found on the page.");
//     }

//     await browser.close();
//   } catch (error) {
//     console.error("Error downloading reel:", error);
//   }
// }

async function downloadInstagramReel(url, chatId) {
  try {
    const browser = await puppeteer.launch({
      headless: false,
      args: [
        "--disable-setuid-sandbox",
        "--no-sandbox",
        "--single-process",
        "--no-zygote",
      ],
      executablePath:
        process.env.NODE_ENV === "production"
          ? process.env.PUPPETEER_EXECUTABLE_PATH
          : puppeteer.executablePath(),
    });
    const page = await browser.newPage();
    await page.setDefaultNavigationTimeout(120000);
    const mp3FilePath = path.join(__dirname);
    // Navigate to the website
    const websiteUrl = "https://instavideosave.net/audio";
    await page.goto(websiteUrl);
    console.log("opened 1st website");
    // Wait for the input element to appear (you may adjust the selector if needed)
    // Focus on the input field
    await page.focus("input[name='url']");

    // Clear the input field by selecting the existing text and deleting it
    await page.keyboard.down("Control");
    await page.keyboard.press("A"); // Select all text
    await page.keyboard.up("Control");
    await page.keyboard.press("Backspace"); // Delete selected text

    // Type the URL you want to enter, followed by a space character
    await page.type("input[name='url']", url + " ");
    await sleep(3000);
    await page.keyboard.press("Backspace"); // Delete selected text
    console.log("enter linked");
    // Click the "Download" button with the class name "bg-blue-600"
    // Click the second "Submit" button
    await page.evaluate(() => {
      const spanElement = document.querySelector("button.bg-blue-600 span");
      if (spanElement) {
        const buttonElement = spanElement.closest("button");
        if (buttonElement) {
          buttonElement.click();
        }
      }
    });

    console.log("chcicked sumbit");
    const client = await page.target().createCDPSession();
    await client.send("Page.setDownloadBehavior", {
      behavior: "allow",
      downloadPath: path.resolve(__dirname),
    });
    // Wait for the second button to appear (you may adjust the selector if needed)
    await page.waitForSelector("button.bg-blue-600.mt-2");

    // Click the second "Download Audio" button
    await page.click("button.bg-blue-600.mt-2");

    // Wait for any download to complete
    // Continuously check for a file with ".mp3" extension
    let interval = setInterval(() => {
      // List files in the download directory
      const files = fs.readdirSync(mp3FilePath);

      // Check if there's a file with a ".mp3" extension
      const mp3File = files.find((file) => file.endsWith(".mp3"));

      if (mp3File) {
        clearInterval(interval);
        browser.close();
        openWebsite(mp3FilePath);
      }
    }, 1000);
  } catch (error) {
    console.error("Error opening the website:", error);
  }
}

// Usage
let instagramUrl =
  "";
const outputFilePath = "reelAudios.mp3"; // Specify the output audio file path
// downloadInstagramReel(instagramUrl, outputFilePath);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

let songname;
let youtubesearchURL;
let scriptExecuted = false;
// Set up the WebDriver
async function openWebsite(mp3FilePath, chatId) {
  const browser = await puppeteer.launch({
    headless: false,
    args: [
        "--disable-setuid-sandbox",
        "--no-sandbox",
        "--single-process",
        "--no-zygote",
        "--start-maximized",
          ],
    executablePath:
        process.env.NODE_ENV === "production"
          ? process.env.PUPPETEER_EXECUTABLE_PATH
          : puppeteer.executablePath(),
  });
  const page = await browser.newPage();
  // Specify the download directory
  const downloadDirectory = path.join(__dirname);

  // Get a list of files in the directory
  const files = fs.readdirSync(downloadDirectory);

  // Find the first ".mp3" file in the list
  const mp3File = files.find((file) => path.extname(file) === ".mp3");

  try {
    await page.setViewport({ width: 1920, height: 1080 });
    await page.goto("https://www.proxysite.com/");
    console.log("enter 1st website");
    const linkToEnter =
      "https://www.aha-music.com/identify-songs-music-recognition-online";
    await page.type("input[type='text']", linkToEnter);

    let currentURL = page.url();

    while (true) {
      try {
        const submitButton = await page.$("button[type='submit']");

        if (submitButton) {
          await submitButton.click();
        }

        await sleep(3000); // Adjust the delay as needed

        const updatedURL = page.url();

        if (currentURL !== updatedURL) {
          break;
        }
      } catch (error) {
        console.error("An error occurred:", error);
        await sleep(2000); // Adjust the delay as needed
      }
    }
    console.log("enter 2nd website");
    await sleep(5000);
    // Wait for the file input element and set the file path
    await page.waitForSelector("input[type='file']");
    const filePath = path.resolve(__dirname, `${mp3File}`); // Replace with your file path
    const fileInput = await page.$("input[type='file']");
    await fileInput.uploadFile(filePath);
    console.log("uploaded file");
    // Wait for the "Accept" button and click it
    await page.waitForSelector(".iAccept");
    await page.click(".iAccept");

    // Wait for the start button and click it
    await page.waitForSelector(".btn.btn-primary.start");
    await page.click(".btn.btn-primary.start");
    console.log("recogn started");
    // Wait for the <pre> element and the <p> element inside it
    await page.waitForSelector("pre.panel.panel-default p", {
      timeout: 20000,
    });

    // Get the text content of the <p> element
    const paragraphText = await page.$eval(
      "pre.panel.panel-default p",
      (element) => element.textContent
    );

    console.log(paragraphText);

    let titleText;
    let artistText;
    const titleIndex = paragraphText.indexOf("Title:");
    const artistIndex = paragraphText.indexOf("Artist:");
    const externalIdsIndex = paragraphText.indexOf("External IDs:");

    // Check if "Title:" and "Artist:" are found
    if (titleIndex !== -1 && artistIndex !== -1) {
      // Extract the text between "Title:" and "Artist:"
      titleText = paragraphText
        .substring(titleIndex + "Title:".length, artistIndex)
        .trim();

      // Log the extracted title
      console.log("Title:", titleText);
    } else {
      console.error("Title and/or Artist not found in the paragraph.");
    }
    if (artistIndex !== -1 && externalIdsIndex !== -1) {
      // Extract the text between "Artist" and "External IDs"
      artistText = paragraphText
        .substring(artistIndex + "Artist:".length, externalIdsIndex)
        .trim();

      // Log the extracted artist text
      console.log("Artist:", artistText);
    } else {
      console.error("Artist and/or External IDs not found in the paragraph.");
    }
    songname = `${titleText} - ${artistText}`;
    console.log("Song Name:", songname);

    // Perform a YouTube search using the songname
    youtubeSearchURL = `https://www.youtube.com/results?search_query=${encodeURIComponent(
      songname
    )}`;

    // Log the YouTube search URL to the console
    console.log("YouTube Search URL:", youtubeSearchURL);
    // Send song information
    if (songname && youtubeSearchURL) {
      bot.sendMessage(chatId, `Song Name: ${songname}\nYouTube Search URL: ${youtubeSearchURL}`);
    } else {
      bot.sendMessage(chatId, "Song information is not available.");
    }
    fs.unlinkSync(filePath);
    console.log("finished file deleted");
    // Set scriptExecuted to true when the script has successfully completed
    scriptExecuted = true;
    await console.log("script executed");
    driver.quit();
    console.log("browser closed");
  } finally {
    // Close the WebDriver
    // await driver.quit();
  }
}

bot.onText(/\/start (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  instagramUrl = match[1]; // Store the Instagram URL provided by the user

  // You can perform further validation on the provided URL if needed

  console.log("Received Instagram URL:", instagramUrl);

  // Now, call the function to download the Instagram reel with the provided URL
  bot.sendMessage(chatId, "Running the script to fetch song information...");

  await downloadInstagramReel(instagramUrl, outputFilePath, chatId);
});


// Start the Express app on a specific port
const port = 3000 || process.env.PORT; // You can choose any port
app.listen(port, () => {
  console.log(`Express app is running on port ${port}`);
});

// Call the function to open the website, upload a file, and click the button
// openWebsite();
