class Queue {
  capacity: number;
  mask: number;
  buffer: any[];
  head: number;
  tail: number;

  constructor(initialCapacity = 1024) {
    // 确保初始容量是 2 的幂
    this.capacity = initialCapacity;
    this.mask = initialCapacity - 1;
    this.buffer = new Array(initialCapacity);
    this.head = 0; // 读指针
    this.tail = 0; // 写指针
  }

  // 动态扩容逻辑
  resize() {
    const oldCapacity = this.capacity;
    const newCapacity = oldCapacity * 2; // 翻倍
    const newBuffer = new Array(newCapacity);

    let count = 0;
    let i = this.head;
    while (i !== this.tail) {
      newBuffer[count++] = this.buffer[i];
      i = (i + 1) & (oldCapacity - 1);
    }

    // 更新状态
    this.buffer = newBuffer;
    this.capacity = newCapacity;
    this.mask = newCapacity - 1;
    this.head = 0;
    this.tail = count; // 数据现在在 0 到 count 之间
  }

  // 写入数据
  push(chunk: any) {
    // 检查是否满
    if (((this.tail + 1) & this.mask) === this.head) {
      this.resize(); // 满了自动扩容
    }

    this.buffer[this.tail] = chunk;
    this.tail = (this.tail + 1) & this.mask;
  }

  // 批量读取数据
  shift(size: number) {
    let result = "";
    let count = 0;

    while (this.head !== this.tail && count < size) {
      result += this.buffer[this.head];
      this.head = (this.head + 1) & this.mask;
      count++;
    }
    return result;
  }

  // 检查是否为空
  isEmpty() {
    return this.head === this.tail;
  }

  // 获取当前缓冲区中的数据量
  size() {
    if (this.head <= this.tail) {
      return this.tail - this.head;
    } else {
      return this.capacity - this.head + this.tail;
    }
  }

  // 清空缓冲区
  clear() {
    this.head = 0;
    this.tail = 0;
  }

  // 查看但不消费数据（peek）
  peek(offset: number = 0) {
    if (offset >= this.size()) return null;
    const index = (this.head + offset) & this.mask;
    return this.buffer[index];
  }

  // 读取所有数据（清空缓冲区）
  readAll() {
    const result = this.shift(this.size());
    return result;
  }
}

export default Queue;
