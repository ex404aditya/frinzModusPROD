// import * as fs from "fs";
// import { exec } from "child_process";
// import axios from "axios";
// import FormData from "form-data";
// import * as path from "path";
// import { promisify } from "util";

// // Constants
// const WHISPER_API_ENDPOINT = "https://api.openai.com/v1/audio/transcriptions";
// const YOUTUBE_DL_PATH = "/usr/local/bin/youtube-dl"; // Ensure youtube-dl path is correct

// // Promisify exec for async/await usage
// const execPromise = promisify(exec);

// // Interfaces
// export interface AudioExtractionResult {
//   filePath: string;
//   duration: number;
//   format: string;
// }

// export interface TranscriptionResult {
//   text: string;
//   language?: string;
//   confidence?: number;
// }

// // Function to extract audio from YouTube link
// export async function extractYouTubeAudio(
//   youtubeUrl: string,
// ): Promise<AudioExtractionResult> {
//   if (!isValidYouTubeUrl(youtubeUrl)) {
//     throw new Error("Invalid YouTube URL");
//   }

//   const outputFilename = `audio_${Date.now()}.mp3`;
//   const outputPath = path.join("/tmp", outputFilename);
//   const command = `${YOUTUBE_DL_PATH} -x --audio-format mp3 --output "${outputPath}" "${youtubeUrl}"`;

//   try {
//     await execPromise(command);
//     const audioStats = fs.statSync(outputPath);

//     return {
//       filePath: outputPath,
//       duration: audioStats.size / (128 * 1024), // Approximate duration in seconds
//       format: "mp3",
//     };
//   } catch (error) {
//     throw new Error(
//       `Audio extraction failed: ${error instanceof Error ? error.message : String(error)}`,
//     );
//   }
// }

// // Function to convert audio to text using Whisper API
// export async function convertAudioToText(
//   audioFile: AudioExtractionResult,
// ): Promise<TranscriptionResult> {
//   const formData = new FormData();
//   formData.append("file", fs.createReadStream(audioFile.filePath));
//   formData.append("model", "whisper-1");

//   try {
//     const response = await axios.post(WHISPER_API_ENDPOINT, formData, {
//       headers: {
//         ...formData.getHeaders(),
//         Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
//       },
//     });

//     fs.unlinkSync(audioFile.filePath); // Cleanup after successful request

//     return {
//       text: response.data.text,
//       language: response.data.language || "auto-detected",
//       confidence: response.data.confidence || 0.9,
//     };
//   } catch (error) {
//     cleanupTempFile(audioFile.filePath); // Ensure cleanup on error
//     throw new Error(
//       `Audio transcription error: ${error instanceof Error ? error.message : String(error)}`,
//     );
//   }
// }

// // Utility function to validate YouTube URL
// function isValidYouTubeUrl(url: string): boolean {
//   const youtubeRegex =
//     /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]+/;
//   return youtubeRegex.test(url);
// }

// // Cleanup utility to remove temporary files
// function cleanupTempFile(filePath: string): void {
//   try {
//     if (fs.existsSync(filePath)) {
//       fs.unlinkSync(filePath);
//     }
//   } catch (error) {
//     console.warn(
//       `Failed to clean up file: ${error instanceof Error ? error.message : String(error)}`,
//     );
//   }
// }

// // Handle and log errors gracefully
// export function handleYouTubeProcessingError(
//   error: Error,
// ): TranscriptionResult {
//   console.error(`YouTube processing error: ${error.message}`);
//   return {
//     text: "Unable to process the YouTube audio. Please check the URL and try again.",
//     language: "unknown",
//     confidence: 0,
//   };
// }
