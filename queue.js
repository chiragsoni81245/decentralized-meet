class Queue {
    constructor() {
        this.items = {};
        this.frontIndex = 0;
        this.rearIndex = 0;
    }

    // Add element to the queue
    enqueue(element) {
        this.items[this.rearIndex] = element;
        this.rearIndex++;
    }

    // Remove and return the front element from the queue
    dequeue() {
        if (this.isEmpty()) {
            return "Queue is empty";
        }

        const frontElement = this.items[this.frontIndex];
        delete this.items[this.frontIndex];
        this.frontIndex++;

        return frontElement;
    }

    // Return the front element without removing it
    front() {
        if (this.isEmpty()) {
            return "Queue is empty";
        }
        return this.items[this.frontIndex];
    }

    // Check if the queue is empty
    isEmpty() {
        return this.frontIndex === this.rearIndex;
    }

    // Return the size of the queue
    size() {
        return this.rearIndex - this.frontIndex;
    }
}