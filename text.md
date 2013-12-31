This is not meant to be an exact transcript of the talk but rather a sort of guide.

# Starters

## Interactivity

There is a small web server currently running for this talk. If 3G gods are with us, during the presentation you can ask questions and rank them so that we will discuss some at the end. You can also rate the content of each slide in real time. Please open the link in your browser and enjoy.

For the record this server runs using Node.js and the webapp uses the small library we made ourselves and will present during this talk.

## Slides built with

For credits, those slides are based on Flowtime.js framework.

# Introduction

## Synchronization

What do we mean by synchronization? We generally have two entities in different states, separated by a network. They of course do not know in which state is the other. If I am A, did B moved to another state? Did I personally moved? Synchronization is the process of converging both to a common one. We can also speak of reconciliation.

## Client server

Let's take another assumption: we are building a client server application. Algorithms we will discuss would also work in a P2P architecture but would be less suitable. We do not assume that there is one physical server as the diagram may suggest, but there is one central accessible place where data is stored and a lot of clients which access it. 

So many clients that the server generally cannot track all of them individually. This is the scheme for web applications, mobile, desktop, on your smart television... You have one central point to which many (billions?) of clients connect.

# Mostly offline

Looking at applications use case, there is another important aspect easily seen for mobile applications: they go offline very often (willingly or by constraint). How many times a day do you go through an area not covered by 3G with your phone? And sometimes they go offline for a long time. Easily seen for desktop web applications: for how long do you let your Gmail tab closed before reopening it?

The talk will be about the different constraints that you have here and possible solutions depending on your needs to solve that use case: as a client, when I come back online, how to synchronize with the server? We will be speaking about general aproaches and about one library that we are building to solve one use case.

# Features

## Supported operations

We want to support all kind of operations. Creating a new item on a client must be visible on others. An item being modified must be visible on all clients. And it is important to also mention that deleting an item must be propagated to other clients. Said like that it seems trivial, but it is usually the one aspect that people forget about in the initial design, and then it may be impossible to integrate naturally.

## Selective data model

Another important feature we usually want is a selective data model. The whole dataset usually must not be synchronized to all clients. First because of access rights, I should not see Facebook private messages from my neighbor. But also because of the volume of data involved, one would not want to try synchronizing every single tweet ever sent on a poor iPhone over 3G. So each user may want to synchronize a personal subset of the dataset.

## Evaluation

How will we evaluate the different solutions we will talk about?

First and most obviously in terms of bandwidth. Of course since client and server are separated by a network, and not an in-datacenter one, this is an important criteria. If the data to synchronize weights 100Mb and that only one kb-sized items changed since the last synchronization one do not expect to need a big pack to be downloaded.

Second criteria is the number of roundtrips. Some algorithms will involve a complex set of requests to be made to the server and the bigger the number of roundtrips, the bigger synchronization duration will be.

We will also take into account the computational cost of synchronization. Does it need a lot of CPU on the client and/or on the server to work? For the client it is important depending on your target. For the server it may impact cost because of the number of CPUs you will need to provision. But the criteria also includes memory, manipulated data structures may consume a lot of RAM.

Then error correction is to be taken into account. Will a rogue-edit in your database be synchronized to clients? What happens in you had a bug in your client implementation and that he missed some data? Will the algorithm smoothly recover once you fix the bug or will you need to cleanup the client and restart from scratch? Those are important aspects, who never fought against an email desparately unread on your frontend while you marked it as read hundreds of times?

The last criteria is how easy is setup. Do you need to tie yourself with a complex data framework? Is it something which can be easily plugged into your existing architecture? How much should you tinker before getting something stable?

# Common

Let's now discuss the actual algorithms.

## Initiated by the client

There is one thing common to all: synchronization is initiated by the client. As a first setup the client must be setup to record changes happening while offline. If you want to stick to asynchronous UIs you can even record changes and push to the server asynchronously even when online. Then upon synchronization, the client starts by pushing all edits to the server, and only then pulls changes from the server. We recommend this because the number of edits on the client will remain relatively small, it concerns the action of only one user.

You can of course combine that with push notifications. Push cannot be your only medium because it is unreliable when clients are disconnected. But it can be a very nice addition to asynchronous synchronization (sic) to make your app far more responsive.

# Wholesale

## Algorithm

## Evaluation

# Timestamps

## How to

## Filters

## Errors

## Clocks

## Evaluation
