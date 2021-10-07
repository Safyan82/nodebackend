const express = require("express");
const router = express.Router();
const youtubeController = require ("../controller/youtubeController");
const fbController = require ("../controller/fbController");
const twitterController = require ("../controller/twitterController");

router.post("/parse",youtubeController.getInfo)

router.post("/hd",youtubeController.downloadHighQuality)


router.get("/youtube/:query",youtubeController.youtubeSearch)
router.get("/suggestion",youtubeController.youtubeSuggestion)
router.get("/getPlayer/:id",youtubeController.getPlayerUrl)

router.get("/getKeywords/:key",youtubeController.getKeyWords)



// router for fb

router.post("/fb",fbController.fbInfo)
router.post("/fb/downloader",fbController.fbdownloader)


// route fro tv

router.post("/tw",twitterController.twitterInfo)
router.post("/tw/downloader",twitterController.twitterdownloader)



module.exports=router;