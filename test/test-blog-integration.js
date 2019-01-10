'use strict'

const chai = require('chai');
const chaiHttp = require('chai-http');
const faker = require('faker');
const mongoose = require('mongoose');

const expect = chai.expect;

const {Test_DATABASE_URL} = require('../config');
const {BlogPost} = require('../models');
const {app, runServer, closeServer} = require('../server')

chai.use(chaiHttp)

function seedBlogData(){
    console.info('seeding blogpost data')
    const seedData = [];

    for(let i = 0; i <= 10; i++){
        seedData.push(generateBlogData());
    }
    return BlogPost.insertMany(seedData)
}

function generateBlogData() {
    return {
       title:faker.lorem.words(),
       author:{
            firstName: faker.name.firstName(),
            lastName: faker.name.lastName()
       },
       content:faker.lorem.paragraph()
    }
}

function tearDownDb(){
    console.warn('Delete datbase');
    return mongoose.connection.dropDatabase();
}

describe('BlogPost Api resource', function(){
    
    before(function (){
        return runServer(Test_DATABASE_URL);
    })

    beforeEach(function () {
        return seedBlogData();
    })

    afterEach(function () {
        return tearDownDb();
    })

    after(function (){
        return closeServer();
    })


describe('GET endpoint', function(){
//the isue is that it is not in json format
    it('should return all existing BlogPost', function() {
        let res;
        return chai.request(app)
            .get('/posts')
            .then(function(allPost){
                res = allPost;
                expect(res).to.have.status(200);
                expect(res.body).to.have.lengthOf.at.least(1);
                return BlogPost.count();
            })
            .then(function(count){
                expect(res.body).to.have.lengthOf(count);
            });
    });

    it('should return BlogPost with right fields', function(){
        
        let resBlog;
        return chai.request(app)
            .get('/posts')
            .then(function (res) {
                expect(res).to.have.status(200);
                expect(res).to.be.json;
                expect(res.body).to.be.a('array');
                expect(res.body).to.have.lengthOf.at.least(1);
                res.body.forEach(function(blogpost){
                    expect(blogpost).to.be.a('object');
                    expect(blogpost).to.include.keys(
                        'id','title','content','author');
                });
                resBlog = res.body[0];
                return BlogPost.findById(resBlog.id);
            })
            .then(function(blogpost){
                expect(resBlog.id).to.equal(blogpost.id);
                expect(resBlog.title).to.equal(blogpost.title);
                expect(resBlog.content).to.equal(blogpost.content);
                expect(resBlog.author).to.equal(blogpost.author.firstName + " " + blogpost.author.lastName);
            });
        });
    });

    describe('Post endpoint', function() {
        it('should add a new blogpost', function(){
            const newBlog = generateBlogData();
            return chai.request(app)
                .post('/posts')
                .send(newBlog)
                .then(function(res){
                    expect(res).to.have.status(201);
                    expect(res).to.be.json;
                    expect(res.body).to.be.a('object');
                    expect(res.body).to.include.keys(
                        'id','title','content','author');
                    expect(res.body.id).to.not.be.null;
                    expect(res.body.title).to.equal(newBlog.title);
                    expect(res.body.content).to.equal(newBlog.content);
                    expect(res.body.author).to.equal(newBlog.author.firstName + " " + newBlog.author.lastName);
                    return BlogPost.findById(res.body.id);
                })
                .then(function(blogpost){
                    expect(blogpost.title).to.equal(newBlog.title);
                    expect(blogpost.content).to.equal(newBlog.content);
                    expect(blogpost.author.firstName).to.equal(newBlog.author.firstName);
                    expect(blogpost.author.lastName).to.equal(newBlog.author.lastName);
                })
        })
    })

    describe('Put endpoint', function() {
        it('should update fields you send over', function() {
            const updateData = {
                title:'fire',
                content:'alot of stuff to read',
                author: {
                    firstName:"Mason",
                    lastName:'Tang'
                }
            }

            return BlogPost
                .findOne()
                .then(function(blogpost){
                    updateData.id = blogpost.id;
                    console.log(blogpost)
                    return chai.request(app)
                        .put(`/posts/${blogpost.id}`)
                        .send(updateData)
                })
                .then(function(res){
                    expect(res).to.have.status(204);
                    return BlogPost.findById(updateData.id);
                })
                .then(function(blogpost){
                    expect(blogpost.title).to.equal(updateData.title);
                    expect(blogpost.content).to.equal(updateData.content);
                    expect(blogpost.author.firstName).to.equal(updateData.author.firstName);
                    expect(blogpost.author.lastName).to.equal(updateData.author.lastName);

                });
        });
    });

    describe('DELETE endpoint', function() {
        it('delete a blogpost by id', function() {
            let blogpost;

            return BlogPost
                .findOne()
                .then(function(foundBlog){
                    blogpost = foundBlog;
                    return chai.request(app).delete(`/posts/${blogpost.id}`);
                })
                .then(function(res){
                    expect(res).to.have.status(204);
                    return BlogPost.findById(blogpost.id);
                })
                .then(function(foundBlog){
                    expect(foundBlog).to.be.null;
                })
        })
    })
})
