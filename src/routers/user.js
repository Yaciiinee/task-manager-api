const express = require('express')
const User = require('../models/user')
const auth = require('../middleware/auth')
const multer = require("multer")
const sharp = require("sharp")
const { sendWelcomeEmail } = require('../emails/account')

const router = new express.Router()

router.post('/users', async(req, res) => {
    const user = new User(req.body)
    try {
        const token = await user.generateAuthToken()

        sendWelcomeEmail(user.email, user.name)

        res.status(201).send({ user, token })
    } catch (e) {
        res.status(400).send(e)
    }
})

router.post('/users/login', async(req, res) => {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password)
        const token = await user.generateAuthToken()
        res.send({ user, token })
    } catch (e) {
        res.status(400).send()
    }
})

router.get('/users/me', auth, async(req, res) => {

    res.send({ user: req.user })
})

router.post('/users/logout', auth, async(req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter((token) => {
            return token.token !== req.token
        })
        await req.user.save()
        res.send()

    } catch (error) {
        res.status(500).send()
    }
})

router.post('/users/logoutall', auth, async(req, res) => {
    try {
        const user = req.user
        user.tokens = []
        await req.user.save()
        res.send()

    } catch (error) {
        console.log('err', error)
        res.status(500).send(error)
    }
})


router.patch('/users/', auth, async(req, res) => {
    const updates = Object.keys(req.body)
    const allowedUpdates = ['name', 'email', 'password', 'age']
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update))

    if (!isValidOperation) {
        return res.status(400).send({ error: 'Invalid updates!' })
    }

    try {

        updates.forEach((update) => req.user[update] = req.body[update])
        await req.user.save()
        res.send(req.user)
    } catch (e) {
        res.status(400).send(e)
    }
})

router.delete('/users', auth, async(req, res) => {
    await req.user.remove()
    res.send(req.user)
})

const upload = multer({
    limits: {
        fileSize: 1000000
    },
    fileFilter: (req, file, callback) => {
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            return callback(new Error("Sorry, only images are accepted"))
        }
        callback(undefined, true)
    }
})

//add avatar
router.post('/users/me/avatar', auth, upload.single("avatar"), async(req, res) => {
    try {
        req.user.avatar = await sharp(req.file.buffer).resize({ 'width': 300, 'height': 300 }).png().toBuffer()
        await req.user.save()
        res.send()
    } catch (e) {
        res.status(500).send()
    }
}, (error, req, res, next) => {
    res.status(400).send({ error: error.message })
})

// delete avatar
router.delete('/users/me/avatar', auth, async(req, res) => {
    try {
        req.user.avatar = undefined;
        await req.user.save()
        res.status(200).send()
    } catch (error) {
        res.status(500).send()
    }
})

// get avatar
router.get("/users/:id/avatar", async(req, res) => {
    try {
        const user = await User.findById(req.params.id)
        if (!user || !user.avatar) {
            throw new Error()
        }
        res.set('content-Type', 'image/png')

        res.send(user.avatar)
    } catch (error) {
        res.status(404).send()
    }
})



module.exports = router