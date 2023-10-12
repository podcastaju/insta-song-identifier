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

const token = "6653608319:AAE0Ehdj_cDJVwLdaNds5dNxKAisrqrskFM"; // Replace with your bot's API token
const bot = new TelegramBot(token, { polling: true });

// Set the path to the ffmpeg executable
ffmpeg.setFfmpegPath(ffmpegPath);

async function downloadInstagramReel(url, outputFilePath) {
  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle0" });

    // Wait for the video to load
    await page.waitForSelector("video", { timeout: 5000 });

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
  const driver = await new Builder().forBrowser("chrome").build();

  try {
    // Maximize the browser window
    await driver.manage().window().maximize();

    await driver.get(`https://www.proxysite.com/`);

    // Locate the input field for entering the link
    const linkInput = await driver.findElement(By.css("input[type='text']"));

    // Enter the link into the input field
    const linkToEnter =
      "https://www.aha-music.com/identify-songs-music-recognition-online"; // Replace with the link you want to enter
    await linkInput.sendKeys(linkToEnter);

    // Define a variable to store the current URL
    let currentURL = await driver.getCurrentUrl();

    // Loop until the URL changes
    while (true) {
      try {
        // Locate and click the button to proceed
        const submitButton = await driver.findElement(
          By.css("button[type='submit']")
        );

        // Click the submit button to proceed
        await submitButton.click();

        // Wait for a short period to allow the page to load
        await sleep(3000); // Adjust the delay as needed

        // Get the updated URL
        const updatedURL = await driver.getCurrentUrl();

        // Check if the URL has changed
        if (currentURL !== updatedURL) {
          break; // Exit the loop if the URL changes
        }
      } catch (error) {
        // Handle any exceptions that occur during interactions
        console.error("An error occurred:", error);
        // Wait for a short period before retrying
        await sleep(2000); // Adjust the delay as needed
      }
    }

    // Locate the file input element
    const fileInput = await driver.findElement(By.css("input[type='file']"));

    // Set the file path to the input element
    const filePath = path.resolve(__dirname, "reelAudios.mp3"); // Replace with your file path
    await fileInput.sendKeys(filePath);

    // Wait for the "Accept" button to become clickable
    const acceptButton = await driver.findElement(By.className("iAccept"));
    await driver.wait(until.elementIsVisible(acceptButton));

    // Click the "Accept" button
    await acceptButton.click();

    // Wait for the button with class name "btn btn-primary start" to become clickable
    const startButton = await driver.findElement(
      By.className("btn btn-primary start")
    );
    await driver.wait(until.elementIsVisible(startButton));

    // Click the start button
    await startButton.click();

    // Wait for the <pre> element with class name "panel panel-default" to appear
    const preElement = await driver.findElement(
      By.className("panel panel-default")
    );

    // Wait for the <p> element to become present inside the <pre> element
    const pElement = await driver.wait(
      until.elementLocated(By.css("pre.panel.panel-default p")),
      10000
    ); // Adjust the timeout as needed

    // Get the text content of the <p> element
    const paragraphText = await pElement.getText();

    // Log the text content to the console
    console.log(paragraphText);
    // Check if there are at least 3 lines (2nd and 3rd lines)
    // Split the text into lines
    const lines = paragraphText.split("\n");
    if (lines.length >= 3) {
      // Extract the 2nd and 3rd lines (index 1 and 2)
      const line2 = lines[1];
      const line3 = lines[2];

      // Remove "Title:" from line2 and "Artist:" from line3
      const songTitle = line2.replace("Title: ", "");
      const artistName = line3.replace("Artist: ", "");

      // Merge the remaining text into songname
      const songname = `${songTitle} - ${artistName}`;

      // Log the merged songname to the console
      console.log("Song Name:", songname);

      // Perform a YouTube search using the songname
      const youtubeSearchURL = `https://www.youtube.com/results?search_query=${encodeURIComponent(
        songname
      )}`;

      // Log the YouTube search URL to the console
      console.log("YouTube Search URL:", youtubeSearchURL);

      // Log the 2nd and 3rd lines to the console
      console.log("2nd Line:", line2);
      console.log("3rd Line:", line3);
      fs.unlinkSync(mp3FilePath);
    } else {
      console.error("Not enough lines in the paragraphText.");
    }
  } finally {
    // Close the WebDriver
    // await driver.quit();
  }
}

bot.on("polling_error", (error) => {
  console.error("Polling error:", error);
});

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
