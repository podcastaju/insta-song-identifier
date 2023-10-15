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
async function downloadInstagramReel(url, outputFilePath) {
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
    await page.setDefaultNavigationTimeout(60000);
    await page.goto(url, { waitUntil: "networkidle0" });

    // Wait for the video to load
    await page.waitForSelector("video", { timeout: 60000 });

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
          openWebsite(mp3FilePath);
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
const instagramUrl =
  "https://www.instagram.com/reel/CxpFFBqyOyo/?utm_source=ig_web_copy_link";
const outputFilePath = "reelAudios.mp3"; // Specify the output audio file path
// downloadInstagramReel(instagramUrl, outputFilePath);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Set up the WebDriver
async function openWebsite(mp3FilePath) {
  // const browser = await puppeteer.launch({
  //   headless: false,
  //   args: ["--start-maximized"],
  //   executablePath:
  //       process.env.NODE_ENV === "production"
  //         ? process.env.PUPPETEER_EXECUTABLE_PATH
  //         : puppeteer.executablePath(),
  // });
  // const page = await browser.newPage();

  try {
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
    await page.setViewport({ width: 1920, height: 1080 });
    await page.goto("https://www.proxysite.com/");

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
    await sleep(5000);
    // Wait for the file input element and set the file path
    await page.waitForSelector("input[type='file']");
    const filePath = path.resolve(__dirname, "reelAudios.mp3"); // Replace with your file path
    const fileInput = await page.$("input[type='file']");
    await fileInput.uploadFile(filePath);

    // Wait for the "Accept" button and click it
    await page.waitForSelector(".iAccept");
    await page.click(".iAccept");

    // Wait for the start button and click it
    await page.waitForSelector(".btn.btn-primary.start");
    await page.click(".btn.btn-primary.start");

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
    const songname = `${titleText} - ${artistText}`;
    console.log("Song Name:", songname);

    // Perform a YouTube search using the songname
    const youtubeSearchURL = `https://www.youtube.com/results?search_query=${encodeURIComponent(
      songname
    )}`;

    // Log the YouTube search URL to the console
    console.log("YouTube Search URL:", youtubeSearchURL);
  } finally {
    // Close the WebDriver
    // await driver.quit();
  }
}

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  console.log("Received a request with chat_id: " + chatId);
  // Run your script here (the code you provided earlier)

  downloadInstagramReel(instagramUrl, outputFilePath);
  // Respond to the Telegram bot with a message
  bot.sendMessage(chatId, "Your script has been executed.");
});

// Start the Express app on a specific port
const port = 3000 || process.env.PORT; // You can choose any port
app.listen(port, () => {
  console.log(`Express app is running on port ${port}`);
});

// Call the function to open the website, upload a file, and click the button
// openWebsite();
