---
date: 2012-05-03
title: Introduction to threads with C++11
categories: ['Tutorial']
tags: ['C++']
---


[The free lunch is over][freelunch]. The time that our complex algorithm was 
running extremely slow on a computer, but ran extremely fast a few years later,
because the processor speeds exploded, is gone. The trend with current processors
is to add more cores, rather than increasing the clock frequency. 

As programmer, you should be aware of this. Of course, processors will always 
perform a bit better each year, but the growth in performance is slowing down. 
Currently, a lot of programs can benefit the most by using multiple threads, 
because of today's multicore processors. 

In this article I'll briefly explain what a thread is, and how you can create
them with the new threading library in C++11. I'm planning to write multiple 
articles about this topic, each going a little bit more in depth. 

[freelunch]: http://www.gotw.ca/publications/concurrency-ddj.htm

<!--more-->

*This is part of a series of articles about multithreading with C++11, the 
other parts are listed below:*

* Part 1: Introduction to threads with C++11
* Part 2: [Protecting your data when using multiple threads][part2]

[part2]: {{< relref "post/multithreading-with-cpp11-protecting-data.md" >}}

What is a thread?
-----------------

On most general purpose computers, we run a lot of processes beside each other. 
But let us ask the question, what is a process? Well, a simple definition is a 
running program. But what is a program then? Another simple definition is a list
of instructions the processor needs to execute. 

Assume we have one single-core processor. How can all these programs run beside
each other? After all, a single-core processor can perform only one instruction 
at the time. Well, that's handled by the operating system. To share the processor
with all these processes, it gives one process a little of bit of time to perform
some instructions, then goes to another process which gets a little bit of time
and so on. Some processes have higher priority than some other, and will get
more processor time than the other. This is called scheduling and is a subject
on itself, and I won't cover it a lot more. 

Within processes, we can have threads. It's a little bit the same principle
described above: on a single-core processor, each thread is given some processor-time.

If we have a non-threading program, we start at the `main()` function, and the 
program is finished when we reach the end of the `main()` function. Fun fact:
when you run this program, the operating system actually creates a new thread
to run the `main()` function in, which we call the 'main thread' (creative name, 
isn't it?).

From the main thread, you can create new threads which should run simultaneous to the main
thread. This means that beside the 'codepath' `main()` till the end of `main()`, 
we now also have another codepath, from the entrypoint of the new thread, till
the end of the thread. The entrypoint of the thread is often the start of an other
function than `main()`, and the end of the thread means the end of that function.
But remember, on a single-core processor, it's not really simultaneous, it shares
the processor with the other threads.

We talked a lot about single-core processors in the above text, but what about
today's multicore processors? Well, this means we can actually do multiple things
at the same time. If your processor has two cores, then two threads can actually
run at the same time, without sharing the processor. If your processor has N
cores, then your processor can run N threads at the same time. And this is why
today multithreading is so important: we can actually do things in parallel.

### Difference between processes and threads

Threads and processes both have the same purpose: running specific tasks
simultaneous to each other. Why do they both exist? Well there are some differences,
summarized below.

#### Properties of a process

* The stack of a process is safe
* Each process has his own memory, which can't be altered by other programs.
  (Probably there are ways to do it, but in normal circumstances it can't be done).
    * Because each process has it's own memory, the memory is **safe**, but inter-process communication
      is _slow_
* Switching from one process to another is heavy: processor-cache flush, memory
  management unit TLB flush.

#### Properties of a thread

* The stack of a thread is safe
* Each thread shares the same memory within the same process
    * Shared memory is **unsafe**, but inter-process communication is _fast_
* Switching from one thread to another is _fast_ (no flushes)

Please, give me some code!
--------------------------

Fine, fine, let's start coding. The new threading library is really nice, and
makes creating a new thread really easy. Consider the example below, we'll walk
through the code afterwards.

```cpp
#include <iostream>
#include <string>
#include <thread>
#include <chrono>
#include <vector>

using std::string;
using std::thread;
using std::vector;
using std::cout;
using std::endl;

/**
 * Prints the given string `num_times` times, with `time_between` miliseconds
 * between each print.
 */ 
void printer(string text, int num_times, int time_between)
{
	for(int i = 0; i < num_times; i++) 
	{
		cout << text << endl;

		// Wait a moment before next print
		std::chrono::milliseconds duration(time_between);
		std::this_thread::sleep_for(duration);
	}
}

int main()
{
	// Create the threads which will each print something
	vector<thread> printers;

	printers.push_back(thread(printer, "Hello", 30, 10));
	printers.push_back(thread(printer, "World", 40, 15));
	printers.push_back(thread(printer, "Parallel World", 40, 20));

	for(auto &p : printers)
	{
		p.join();
	}
	
	return 0;
}
```

Of course, we first include some library files. The `chrono` library and the 
`thread` library are the most important here. Both are new in C++11. The `chrono`
library provides some nice timing capabilities, and the `thread` library the classes
for creating threads.

Then we define a new function called `printer`. This is a very simple function
which just prints the given text a number of times, with a given time in between.
You can see that the `chrono` library provides a nice and clean way to define the
time between each print.

The `main` function is a bit more interesting, in here we create the other threads.
C++11 provides a class `thread`. As you can see, we create three objects of this
class, and put them all in a vector. 

The `thread` constructor accepts a function as the first argument, and the rest
of the arguments will be passed to the given function. 

Because the `vector` implements the iterator API, we can use the new C++11 range
based for syntax, and on each `thread` object we call the method `join`. This
makes sure the calling thread will now wait for the joined thread to exit, before
it finishes itself (in this case the main thread, and thus the whole program). 
In our case each of the printer threads has to exit before the main thread 
finishes.

### Running the program

When we compile and run this program, we get the following output:

```
HelloWorld

Parallel World
Hello
World
Parallel World
Hello
World
Hello
Parallel World
Hello
World
Hello
Parallel World
World
Hello
Hello
World
Parallel World
Hello
World
Hello
Parallel World
World
Parallel World
World
World
Parallel World
Parallel World
Parallel World
Parallel World
Parallel World
Parallel World
Parallel World
Parallel World
```

So yeah, we can see that our printer threads run beside each other, and 
not sequential. 

There's one thing to note here, although we have the following code:

`cout << text << endl;`

In the first line of the above output, the 'Hello' and
'World' are not on seperate lines. Something is not completely right, but the why
and how to fix will be covered in my next article.
