let person = prompt("Please enter number of blocks", "");
let kal = parseInt(person);
blockSizes = [];
for (let i = 0; i < kal; i++) {
    let person2 = prompt("enter size of block", "");
    let kal1 = parseInt(person2);
    blockSizes.push(kal1);
}
let mal = 0;
function Process(size, time) {
    this.size = size;
    this.timeLeft = time;
    this.allocatedBlock = null;
    this.id = processID;

    processID += 1;

    this.isAllocated = function () {
        return this.allocatedBlock != null;
    };

    this.tick = function () {
        this.timeLeft -= 1;
    };
};

function MemControlBlock(size) {
    this.size = size;
    mal = Math.max(mal, size);
    this.process = null;
    this.available = true;
    this.next = null;
    this.prev = null;
    this.fromPartition = false; // Used to determine whether height of a MemControlBlock needs to be added

    this.setProcess = function (process) {
        if (process == null) {
            this.process = null;
            this.available = true;
        } else {
            this.process = process;
            this.available = false;
        };
    };
};

// Simulates memory
function Heap() {
    this.head = null;
    this.size = 0;

    // Allocate process to memory.
    // Use worst-fit method: from the list of holes, choose the smallest hole
    this.requestAllocation = function (process) {
        blockworstFit = this.head;

        // Make sure our initial best block is valid
        while ((blockworstFit.size < process.size) || (!blockworstFit.available)) {
            blockworstFit = blockworstFit.next;
            if (blockworstFit == null) { return false }; // Means we couldn't even find an initial valid block
        };
        //log("Initial best block: " + blockworstFit.size);

        // See if there's an even better block
        block = blockworstFit.next;
        while (block != null) {
            //log("Testing block: " + block.size);
            if ((block.size >= process.size) && (block.available) && (block.size > blockworstFit.size)) {
                blockworstFit = block;
                //log("New best block: " + blockworstFit.size);
            };
            block = block.next;
        };

        spaceLeftover = blockworstFit.size - (process.size + memControlBlockSize); // Space leftover if block was divided

        // Partition block if needed
        if (spaceLeftover > 0) {
            newBlock = new MemControlBlock(spaceLeftover);

            nextBlock = blockworstFit.next;
            if (nextBlock != null) {
                nextBlock.prev = newBlock;
                newBlock.next = nextBlock;
            };

            blockworstFit.next = newBlock;
            newBlock.prev = blockworstFit;

            blockworstFit.size = process.size;

            newBlock.fromPartition = true;
        };

        blockworstFit.setProcess(process);
        process.allocatedBlock = blockworstFit;
        return true;
    };

    this.deallocateProcess = function (process) {
        process.allocatedBlock.setProcess(null);
        process.allocatedBlock = null;
    };

    this.add = function (block) {
        if (this.head == null) {
            this.head = block;
        } else {
            block.next = this.head;
            this.head.prev = block;
            this.head = block;
        };

        this.size += block.size;
    }

    this.toString = function () {
        string = "[|";
        block = this.head;

        prefix = "";
        suffix = "</span> |";
        while (block != null) {
            if (block.available) { prefix = "<span style='color: #01DF01;'> " } else { prefix = "<span style='color: #FF0000;'> " };
            string += (prefix + block.size + suffix);
            block = block.next;
        };

        string += "]"
        return string;
    };

    this.repaint = function () {
        block = this.head;
        memoryDiv.innerHTML = "";

        while (block != null) {
            height = ((block.size / heap.size) * 100);
            if (block.fromPartition) {
                height += (memControlBlockSize / heap.size) * 100;
            };

            // Create div block element
            divBlock = document.createElement("div");
            divBlock.style.height = (height + "%");
            divBlock.setAttribute("id", "block");
            if (block.available) { divBlock.className = "available" } else { divBlock.className = "unavailable" };
            memoryDiv.appendChild(divBlock);

            // Add size label
            // TODO: Show process details on mouse over
            blockLabel = document.createElement("div");
            blockLabel.setAttribute("id", "blockLabel");
            blockLabel.style.height = (height + "%");
            blockLabel.innerHTML = block.size + "K";
            if (height <= 2) {
                blockLabel.style.display = "none";
            };
            divBlock.appendChild(blockLabel);

            block = block.next;
        };
    };
};

// Handle front-end process submission
document.getElementById("processForm").onsubmit = function () {
    elements = this.elements; // Form elements

    inProcessSize = document.getElementById("pSize");
    inProcessTime = document.getElementById("pTime");

    let sz = parseInt(inProcessSize.value)
    if (sz > mal) {
        alert("please enter size less than block size");

    }
    else {
        process = new Process(parseInt(inProcessSize.value), parseInt(inProcessTime.value));

        /*	heap.requestAllocation(process);
            heap.repaint();*/
        processes.push(process);
        addProcessToTable(process);


    }

    // Clear form
    inProcessSize.value = "";
    inProcessTime.value = "";

    return false;
};

function log(string) {
    logBox.innerHTML += (string + "<br />");
}

function addProcessToTable(process) {
    row = document.createElement("tr");
    row.setAttribute("id", "process" + process.id);

    colName = document.createElement("td");
    colName.innerHTML = process.id;

    colSize = document.createElement("td");
    colSize.innerHTML = process.size;

    colTime = document.createElement("td");
    colTime.setAttribute("id", "process" + process.id + "timeLeft");
    colTime.innerHTML = process.timeLeft;

    row.appendChild(colName);
    row.appendChild(colSize);
    row.appendChild(colTime);

    processTable.appendChild(row);
};

function removeProcessFromTable(process) {
    processTable.removeChild(document.getElementById("process" + process.id));
};

// TODO: Update 'time left' for each row in table 
function refreshTable() {
    for (i = 0; i < processes.length; i++) {
        process = processes[i];
        document.getElementById("process" + process.id + "timeLeft").innerHTML = process.timeLeft;
    };
};

var logBox = document.getElementById("logBox");
var memoryDiv = document.getElementById("memory");
var processTable = document.getElementById("processTable");

var memControlBlockSize = 0;
var processID = 0;
var processes = [];

heap = new Heap();


for (i = 0; i < blockSizes.length; i++) {
    heap.add(new MemControlBlock(blockSizes[i]));
};

// Draw initial heap
heap.repaint();

// Start clock
// Loop through all processes and allocate those that require allocation. Deallocate those that have <0 time remaining
var clock = setInterval(function () {
    for (i = 0; i < processes.length; i++) {
        process = processes[i];

        if (!process.isAllocated()) {
            heap.requestAllocation(process);
        } else {
            process.tick();
            if (process.timeLeft < 1) {
                // Deallocate process from heap
                heap.deallocateProcess(process);

                // Remove process from processes array
                index = processes.indexOf(process);
                if (index > -1) {
                    processes.splice(index, 1);
                };

                // Remove process from table
                removeProcessFromTable(process);
            };
        };
    };

    refreshTable();
    heap.repaint();
}, 1000);




