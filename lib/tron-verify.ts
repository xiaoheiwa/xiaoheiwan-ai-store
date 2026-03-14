// TRC20 USDT Transaction Verification
// Uses TronScan API to verify transactions

const USDT_CONTRACT = "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t" // TRC20 USDT contract address
const TRONSCAN_API = "https://apilist.tronscanapi.com/api"

interface TronTransaction {
  confirmed: boolean
  contractRet: string
  toAddress: string
  amount: string
  tokenInfo?: {
    tokenAbbr: string
    tokenDecimal: number
  }
}

interface VerifyResult {
  success: boolean
  error?: string
  amount?: number
  confirmed?: boolean
}

export async function verifyUsdtTransaction(
  txHash: string,
  expectedAddress: string,
  expectedAmount: number,
  tolerance: number = 0.01 // 1% tolerance for amount
): Promise<VerifyResult> {
  try {
    // Clean tx hash
    const cleanTxHash = txHash.trim()
    
    if (!cleanTxHash || cleanTxHash.length < 60) {
      return { success: false, error: "无效的交易哈希" }
    }

    // Query TronScan API for TRC20 transfer details
    const response = await fetch(
      `${TRONSCAN_API}/transaction-info?hash=${cleanTxHash}`,
      {
        headers: {
          "TRON-PRO-API-KEY": process.env.TRON_API_KEY || "",
        },
      }
    )

    if (!response.ok) {
      // Fallback to alternative API
      return await verifyViaTronGrid(cleanTxHash, expectedAddress, expectedAmount, tolerance)
    }

    const data = await response.json()

    if (!data || data.contractRet !== "SUCCESS") {
      return { success: false, error: "交易未成功或不存在" }
    }

    // Check if it's a TRC20 transfer
    const trc20Info = data.trc20TransferInfo?.[0]
    
    if (!trc20Info) {
      return { success: false, error: "非 TRC20 转账交易" }
    }

    // Verify it's USDT
    if (trc20Info.contract_address !== USDT_CONTRACT) {
      return { success: false, error: "非 USDT 交易" }
    }

    // Verify recipient address
    const toAddress = trc20Info.to_address?.toLowerCase()
    if (toAddress !== expectedAddress.toLowerCase()) {
      return { success: false, error: "收款地址不匹配" }
    }

    // Verify amount (USDT has 6 decimals)
    const actualAmount = Number(trc20Info.amount_str) / 1_000_000
    const minAmount = expectedAmount * (1 - tolerance)
    const maxAmount = expectedAmount * (1 + tolerance)

    if (actualAmount < minAmount) {
      return { 
        success: false, 
        error: `转账金额不足: 收到 ${actualAmount} USDT, 需要 ${expectedAmount} USDT`,
        amount: actualAmount
      }
    }

    // Check confirmation
    const confirmed = data.confirmed || false

    return {
      success: true,
      amount: actualAmount,
      confirmed,
    }
  } catch (error) {
    console.error("USDT verification error:", error)
    return { success: false, error: "验证服务暂时不可用，请稍后重试" }
  }
}

// Fallback verification via TronGrid
async function verifyViaTronGrid(
  txHash: string,
  expectedAddress: string,
  expectedAmount: number,
  tolerance: number
): Promise<VerifyResult> {
  try {
    const response = await fetch(
      `https://api.trongrid.io/v1/transactions/${txHash}/events`,
      {
        headers: {
          "TRON-PRO-API-KEY": process.env.TRON_API_KEY || "",
        },
      }
    )

    if (!response.ok) {
      return { success: false, error: "无法查询交易信息" }
    }

    const data = await response.json()
    
    if (!data.data || data.data.length === 0) {
      return { success: false, error: "交易不存在或未确认" }
    }

    // Find USDT transfer event
    const transferEvent = data.data.find(
      (event: any) => 
        event.contract_address === USDT_CONTRACT &&
        event.event_name === "Transfer"
    )

    if (!transferEvent) {
      return { success: false, error: "非 USDT 转账交易" }
    }

    // Get transfer details
    const toAddress = "T" + transferEvent.result?.to?.substring(2) || ""
    const amount = Number(transferEvent.result?.value || 0) / 1_000_000

    // Verify address (TronGrid returns base58 address)
    if (toAddress.toLowerCase() !== expectedAddress.toLowerCase()) {
      return { success: false, error: "收款地址不匹配" }
    }

    // Verify amount
    const minAmount = expectedAmount * (1 - tolerance)
    if (amount < minAmount) {
      return { 
        success: false, 
        error: `转账金额不足: 收到 ${amount} USDT, 需要 ${expectedAmount} USDT`,
        amount
      }
    }

    return {
      success: true,
      amount,
      confirmed: true,
    }
  } catch (error) {
    console.error("TronGrid verification error:", error)
    return { success: false, error: "验证服务暂时不可用" }
  }
}
