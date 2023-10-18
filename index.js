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
ffmpeg.setFfmpegPath(ffmpegPath);
// puppeteer start
async function downloadInstagramReel(url, outputFilePath, chatId) {
  try {
    const browser = await puppeteer.launch({
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
    await page.goto(url, { waitUntil: "networkidle0" });

    // Wait for the video to load
    await page.waitForSelector("video", { timeout: 120000 });

    const videoUrl = await page.evaluate(() => {
      const videoElement = document.querySelector("video");
      return videoElement ? videoElement.src : null;
    });

    if (videoUrl) {
      const videoResponse = await axios.get(videoUrl, {
        responseType: "stream",
      });
      const videoStream = videoResponse.data;

      const videoFilePath = "temp_video.mp4"; // Temporary video file
      const fileStream = fs.createWriteStream(videoFilePath);
      videoStream.pipe(fileStream);

      await new Promise((resolve) => {
        fileStream.on("finish", resolve);
      });

      // Convert the video to MP3
      const mp3FilePath = outputFilePath;
      ffmpeg()
        .input(videoFilePath)
        .audioCodec("libmp3lame")
        .toFormat("mp3")
        .on("end", () => {
          console.log("Reel converted to MP3 successfully.");
          fs.unlinkSync(videoFilePath); // Remove the temporary video file
          // Now that the MP3 file is ready, call the openWebsite function
          openWebsite(mp3FilePath, chatId);
        })
        .on("error", (err) => {
          console.error("Error converting to MP3:", err);
        })
        .save(mp3FilePath);
    } else {
      console.error("Video URL not found on the page.");
    }

    await browser.close();
  } catch (error) {
    console.error("Error downloading reel:", error);
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
    const filePath = path.resolve(__dirname, "reelAudios.mp3"); // Replace with your file path
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
    fs.unlinkSync(mp3FilePath);
    console.log("finished file deleted");
    // Set scriptExecuted to true when the script has successfully completed
    scriptExecuted = true;
    console.log("script executed");
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
