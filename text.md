This is not meant to be an exact transcript of the talk but rather a sort of guide.

# Starters

## Interactivity

There is a small web server currently running for this talk. If 3G gods are with us, during the presentation you can ask questions and rank them so that we will discuss some at the end. You can also rate the content of each slide in real time. Please open the link in your browser and enjoy.

For the record this server runs using Node.js and the webapp uses the small library we made ourselves and will present during this talk.

## Slides built with

For credits, those slides are based on Flowtime.js framework.

# Introduction

## Web application

Let's take an assumption: we are building a web application. Of course it may run on mobiles and tablets, but also on wide screen desktops, small screen laptops. Actually any device which is able to connect to the web. What if the device on the left was a smart TV?

## Client server

And the application model is mainly the one of the client/server. With so many clients that the server generally cannot track all of them individually. You have one central point to which many (billions?) of clients connect.

We do not assume that there is one physical server as the diagram may suggest, but there is one central accessible place where data is stored and a lot of clients which access it.

Algorithms we will discuss would also work in a P2P architecture but would be less suitable.

# Mostly offline

There is another important aspect easily seen for mobile applications: they go offline very often (willingly or by constraint). How many times a day do you go through an area not covered by 3G with your phone? And sometimes they go offline for a long time. This one is easily seen for desktop web applications: for how long do you let your Gmail tab closed before reopening it?

When disconnected, any other client may modify the state of the server. And we generally expect applications to work while offline, maybe in a degraded mode, and to modify its state too. It means that when the client comes back online it needs to synchronize its state.

## Synchronization

What do we mean by synchronization? We generally have two actors in different states, separated by a network. They of course do not know in which state is the other. If I am A, did B moved to another state? Did I personally moved? Synchronization is the process of converging both to a common one. We can also speak of reconciliation.

The talk will be about the different constraints that you have here and possible solutions depending on your needs to solve that use case: as a client, when I come back online, how to synchronize with the server? We will be speaking about general aproaches and about one library that we are building to solve one use case.

# Features

## Supported operations

We want to synchronize the result of applying all kind of operations. Both making the server aware of what the client did while offline and fetching changes made by all other clients.

Creating a new item on a client must be visible on others. An item being modified must be visible on all clients. And it is important to also mention that deleting an item must be propagated to other clients. Said like that it seems trivial, but it is usually the one aspect that people forget about in the initial design, and then it may be impossible to integrate naturally.

## Selective data model

Another important feature we usually want is a selective data model. The whole dataset usually must not be synchronized to all clients. First because of access rights, I should not see Facebook private messages from my neighbor. But also because of the volume of data involved, one would not want to try synchronizing every single tweet ever sent on a poor iPhone over 3G. So each user may wants to synchronize a personal subset of the dataset.

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

There is one thing common to all: synchronization is initiated by the client. As a first step the client must be setup to record changes happening while offline. If you want to stick to asynchronous UIs you can even record changes and push to the server asynchronously even when online. Then upon synchronization, the client starts by pushing all edits to the server, and only then pulls changes made by other clients. We recommend this because the number of edits on the client will remain small and relatively easy to track, it concerns the action of only one user.

The reasons for doing that are

* batch updates may be better handled by calling a specific endpoint on the server rather than sending individual modifications
* updates usually require some business rules to be validated, that automatic synchronization could not handle

You can of course combine that with push notifications. Push cannot be your only medium because it is unreliable when clients are disconnected. But it can be a very nice addition to asynchronous synchronization (sic) to make your app far more responsive.

## Conflicts

We assumed that applications could go offline, so it must be partition tolerant. And with that usually comes conflicts, two users doing a different edit to the same entity. With the model taken here, the conflict is detected when the second client tries to push its local edits. To us the solution is to refuse this push and require the client to do the merge. That does not necessarily mean that the actual user will do the merge, but that the application running on the client must be designed to do it. It is specific to your business case, no global choice can be made by any library.

The good news is that with the chosen model, conflicts only happen when pushing local changes. When pulling, all changes from the server should be blindly taken.

# Wholesale

## Algorithm

The algorithm is the simplest we could imagine: transfer the whole dataset to the client. Selective data model is also easy, just parameterize the database query on the endpoint and you have it.

That may seem like a horrible idea, but at least it works, no surprise! And I bet there are use cases for which it is perfectly valid. Do not optimize before you need to.

## Evaluation

Evaluation is pretty straigforward here. Bandwidth is wasted because non modified entities are nonetheless transferred. Only one roundtrip is needed. Errors, rogue edits, everything is resolved on the next synchronization. And the setup if of course very simple.

## Versioned entities

For many business cases one attaches a version identifier to entities, that is every time you modify something it gets a new version. All version are sometimes stored to keep track of what happens. That can be used to improve wholesale transfer by only sending all entity identities and latest versions. If one does not have an explicit attribute, consistent hashing of meaningful attributes can be used.

Notice that if you keep track of all versions it can be leveraged to let the application do three-way merges upon conflict.

## Rsync

This is for example what Rsync does. The client requests the `MD5` hash of all files on the target, computes the same locally, and sends only different and missing files. Rsync makes other optimizations by taking chunks of files instead of whole files, and even being able to detect chunks for which offset changed.

## Versioned evaluation

Bandwidth is a bit reduced compared to the other but one still needs to transmit a datastructure whose size is proportional to the number of items in the store, regardless the number of edits.

Roundtrips on the other hand increases a lot because the client must fetch modified entities one by one after having the list of changed ones. One could also use lazy loading in the client storage and actually request entity content only when needed.

Computational cost remains limited, error correction is preserved if one guaranties that there are no rogue edits to the database for which the version would not change. Setup remains very easy.

# Timestamps

## How to

## Version identifier

Even though we generally speak of numeric timestamps because it looks easy to deal with. What is important there is having:

* a version identifier which changes whenever anything in the dataset changes
* a way to retrieve operations between two versions

It may look strange but a version control system like Git and its JS implementation can be a solution for some (relatively rare) cases, namely if you need the full repository history to live on clients.

The main difference between timestamps and other solutions is that timestamps are ordered and if you index your database on them you can find all modifications within two instants in a very efficient manner. Git commits on the other hand require to look through parents of each commit until finding the last one the client knew about.

## Clocks

There is still an important thing to think about when using timestamps: they must come from a globally stricly increasing source.

And this is almost impossible to achieve if you are relying only on computer clock because clocks on different nodes are not in sync. One way to achieve it is given in [Google's Spanner](http://research.google.com/archive/spanner.html) paper. Only leader nodes can assign write timestamps, and they are allowed to do so only for a period of time explicitly allowed by all slaves. If the leader fails, slaves must wait until the lease period expires before electing a new leader. And to definitely be sure that the lease period expired, they had to plug GPS sensors on their computers and house atomic clocks in their datacenters.

Even if you have only one node, its clock may go backwards! For example when syncing with an NTP server and discovering its physical clock goes too fast.

So you need a timestamp oracle which gives you strictly increasing timestamps. We did not find any so if you know one please email it to us.

## Filters

http://wiki.apache.org/couchdb/Replication#Filtered_Replication

## Evaluation

## Couch/PouchDB

# Mathematical

The last aproach to synchronization is less direct but gives interesting results. We present here one possible data structure here.

## Idea

## Combined with versioning

If one uses versioned entities version one can synchronize only entity identity and version and then lazy load actual content, like for wholesale transfer.

## Evaluation

With this solution, bandwidth is used very efficiently because data transferred is proportional the the changeset size, regardless how many items are to be synchronized. To be more precise it is proportional to the number of entities modified times the size of an entity. So entity choice may impact performances.

The solution leads to a few roundtrips, logarithmic growth in term of changed entities number is not that much, but still greater than other aproaches that did it in one shot.

Computational cost is pretty high because with a lot of binary operations. Since the data structure is map/reduce friendly it can be computed ahead of time but then we can count memory used to cache it as a computation cost.

Error correction is very interesting here, because even rogue edits to your database are taken into account. Except if you have caches or use map/reduce on top of the database.

Setup may seem very high, but I would argue not that much in the end because we developed a library to do that for you. To be honest the library is under heavy development, but it already does its job and if you need it tomorrow in production your contribution is warmly welcome.

# TODO

big-O on all evaluations
