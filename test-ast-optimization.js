// 测试 AST 优化的日志插入
// 在不同场景下测试光标位置，观察日志插入位置

// ✅ 场景 1: 简单变量声明
const userName = 'Alice';
// <- 光标在 userName 行，应该在这里插入日志

// ✅ 场景 2: 函数调用参数中间
const result = someFunction(
  arg1,  // <- 光标在这里
  arg2,
  arg3
);
// <- 应该在这里插入日志（语句结束后）

// ✅ 场景 3: 对象字面量属性中间
const user = {
  name: 'Bob',  // <- 光标在这里
  age: 25,
  city: 'NYC'
};
// <- 应该在这里插入日志

// ✅ 场景 4: 链式调用中间
const data = api
  .fetch('/users')  // <- 光标在这里
  .then(res => res.json())
  .catch(err => console.error(err));
// <- 应该在这里插入日志

// ✅ 场景 5: 数组解构
const [first, second, third] = [1, 2, 3];
// <- 光标在解构行，应该在这里插入日志

// ✅ 场景 6: 函数声明内部
function processData(input) {
  const processed = input.trim();  // <- 光标在这里
  // <- 应该在这里插入日志

  return processed.toUpperCase();
}

// ✅ 场景 7: 箭头函数
const square = (n) => {
  const result = n * n;  // <- 光标在这里
  // <- 应该在这里插入日志

  return result;
};

// ✅ 场景 8: if 语句内部
if (condition) {
  const value = calculate();  // <- 光标在这里
  // <- 应该在这里插入日志

  console.log(value);
}

// ✅ 场景 9: 三元表达式
const status = isActive
  ? 'active'  // <- 光标在这里
  : 'inactive';
// <- 应该在这里插入日志

// ✅ 场景 10: 复杂嵌套
const config = createConfig({
  api: {
    baseUrl: 'https://api.example.com',  // <- 光标在这里
    timeout: 5000
  },
  auth: {
    token: getToken()
  }
});
// <- 应该在这里插入日志

// 测试说明：
// 1. 将光标放在标注的行
// 2. 按 Cmd/Ctrl + Shift + L 插入日志
// 3. 观察日志是否插入在正确的位置（语句结束后）
