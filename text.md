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
