/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-restricted-syntax */
const path = require('path')
const { URL } = require('url')
const sharp = require('sharp')
const fs = require('fs')
const axios = require('axios')
const { v4: uuidv4 } = require('uuid')

const ARRAY_IMAGE = [
  'https://storage-aci.secureswiftcontent.com/viuit/merchant/7/products/88b683eb-5a11-4cd6-ad97-3251f4990045_1698822786187.jpg',
  'https://storage-aci.secureswiftcontent.com/viuit/merchant/3888/products/38d9dc8b-af48-4757-8c89-2b65e9666063_1698295521907.png',
] // Example of image online, can also change to image locally

const EXTENSION_IMAGES = ['.jpg', '.png', '.webp', '.jpeg']

const DEFAULT_WIDTH = 360
const TEMP_FOLDER_PATH = `temp`

async function getUrl(link) {
  const config = {
    method: 'GET',
    url: link,
    timeout: 1000 * 20, // Wait for 20 seconds
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
    responseType: 'arraybuffer',
  }
  const response = await axios(config)
  const buffer = Buffer.from(response.data, 'binary')
  return buffer
}

async function getImage(url) {
  const ext = path.extname(url)
  if (EXTENSION_IMAGES.includes(ext)) {
    const parsedUrl = new URL(url.replace('alt%3Dmedia', ''))
    const readableStreamImage = await getUrl(parsedUrl.href)
    return readableStreamImage
  }
  return null
}

async function resizeImage(readableStream) {
  const resize = await sharp(readableStream, { failOnError: false })
    .resize({
      width: DEFAULT_WIDTH,
      kernel: 'mitchell',
      withoutEnlargement: true,
      fastShrinkOnLoad: false,
    })
    .sharpen()
    .webp()
    .toBuffer()
  return resize
}

async function createFile(filePath, fileBase64) {
  await new Promise((resolve, reject) => {
    fs.writeFile(filePath, fileBase64, { encoding: 'base64' }, (err) => {
      resolve(true)
      reject(err)
    })
  })
}

async function saveResize(readableStream) {
  const dataName = `${uuidv4()}_${new Date().getTime()}.webp` // always made webp

  // Create Temp Folder
  if (!fs.existsSync(path.resolve(TEMP_FOLDER_PATH))) {
    fs.mkdirSync(path.resolve(TEMP_FOLDER_PATH), { recursive: true })
  }

  const filePath = path.resolve(`${TEMP_FOLDER_PATH}/${dataName}`)
  const convBuff = readableStream.toString('base64')
  const fileBase64 = convBuff.split(';base64,').pop()

  await createFile(filePath, fileBase64)
}

async function run() {
  if (ARRAY_IMAGE.length > 0) {
    for await (const url of ARRAY_IMAGE) {
      const dataImage = await getImage(url)
      if (dataImage) {
        const dataResize = await resizeImage(dataImage)
        await saveResize(dataResize)
      }
    }
  }
}

run()
