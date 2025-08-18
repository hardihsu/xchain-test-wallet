export const API_URL = "http://localhost:3333";

// 查询余额
export async function getBalance(address: string) {
  const res = await fetch(`${API_URL}/balance/${address}`);
  return res.json();
}

// 发送交易
export async function sendTransaction(tx: any) {
  const res = await fetch(`${API_URL}/tx`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(tx),
  });
  return res.json();
}

// 挖矿
export async function mine(miner: string) {
  const res = await fetch(`${API_URL}/mine`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ miner }),
  });
  return res.json();
}

// 获取所有区块
export async function getChain() {
  const res = await fetch(`${API_URL}/chain`);
  return res.json();
}

// 获取交易池
export async function getPendingTransactions() {
  // const res = await fetch(`${API_URL}/pending`);
  // return res.json();
  return []; // waiting to be done 
}
