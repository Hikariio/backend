const Sauce = require('../models/Sauce');
const fs = require('fs');
const { json } = require('express');


exports.getAllSauces = (req, res, next) => {
    Sauce.find()
        .then(sauces => res.status(200).json(sauces))
        .catch(error => res.status(400).json({ error }));
}

exports.getOneSauce = (req, res, next) => {
    Sauce.findOne({ _id: req.params.id })
        .then(sauces => res.status(200).json(sauces))
        .catch(error => res.status(400).json({ error }));
}

exports.createSauce = (req, res, next) => {
    const sauceObject = JSON.parse(req.body.sauce);
    const sauce = new Sauce({
        ...sauceObject,
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
    })
    sauce.save()
        .then(() => res.status(201).json({ message: 'Nouvelle sauce créé !' }))
        .catch(error => res.status(400).json({ error }))
}

exports.updateSauce = (req, res, next) => {
    const sauceObject = req.file ?
        {
            ...JSON.parse(req.body.sauce),
            imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
        } : { ...req.body };

    if (req.file) {
        Sauce.findOne({ _id: req.params.id })
            .then(sauce => {
                const filename = sauce.imageUrl.split('/images/')[1];
                fs.unlink(`images/${filename}`, (err => {
                    if (err) console.log(err);
                    else {
                        console.log("\nDeleted file");
                    }
                }));
            })
            .catch(error => res.status(400).json({ error }))
    }

    Sauce.updateOne({ _id: req.params.id }, { ...sauceObject, _id: req.params.id })
        .then(() => res.status(200).json({ message: 'Sauce modifié !' }))
        .catch(error => res.status(400).json({ error }));
}

exports.deleteSauce = (req, res, next) => {
    Sauce.findOne({ _id: req.params.id })
        .then(sauce => {
            const filename = sauce.imageUrl.split('/images/')[1];
            fs.unlink(`images/${filename}`, () => {
                Sauce.deleteOne({ _id: req.params.id })
                    .then(() => next())
                    .catch(error => res.status(400).json({ error }));
            })
            res.status(200).json({ message: 'Sauce supprimé'});
        })
        .catch(error => res.status(400).json({ error }))
}

exports.likeSauce = (req, res, next) => {
    const like = req.body.like
    const sauceId = req.params.id
    const userId = req.body.userId

    switch(like){
        case 1 :
             Sauce.updateOne({ _id: sauceId }, { $push: { usersLiked: userId }, $inc: { likes: +1 }})
                .then(() => res.status(200).json({ message: `J'aime` }))
                .catch((error) => res.status(400).json({ error })) 
            break;
        case -1 :
             Sauce.updateOne({ _id: sauceId }, { $push: { usersDisliked: userId }, $inc: { dislikes: +1 }})
                .then(() => res.status(200).json({ message: `Je n'aime pas` }))
                .catch((error) => res.status(400).json({ error })) 
            break;  
        default :
             Sauce.findOne({ _id: req.params.id })
                .then(sauce =>{
                    if (sauce.usersLiked.includes(userId)){
                        Sauce.updateOne({ _id: sauceId }, { $pull: { usersLiked: userId }, $inc: { likes: -1 }})
                        .then(() => res.status(200).json({ message: `Le like a été supprimé` }))
                        .catch((error) => res.status(400).json({ error })) 
                    }
                    else if(sauce.usersDisliked.includes(userId)){
                        Sauce.updateOne({ _id: sauceId }, { $pull: { usersDisliked: userId }, $inc: { dislikes: -1 }})
                        .then(() => res.status(200).json({ message: `Le dislike a été supprimé` }))
                         .catch((error) => res.status(400).json({ error }))   
                    }
                })
            break;    
    }
}

