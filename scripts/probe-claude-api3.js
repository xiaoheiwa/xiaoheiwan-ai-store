import fetch from "node-fetch"

const BASE = "https://quickplus.vip/api.php"
const CODE = "C8PPVXKKPY4N1BGW"
const UID = "416895c9-7c00-4317-9020-031b6a3d46b2"

const tests = [
  // Bind actions
  `action=bind_user&code=${CODE}&claude_user_id=${UID}`,
  `action=bind_account&code=${CODE}&claude_user_id=${UID}`,
  `action=bind&code=${CODE}&claude_user_id=${UID}`,
  `action=bindUser&code=${CODE}&claude_user_id=${UID}`,
  `action=bindAccount&code=${CODE}&claude_user_id=${UID}`,
  `action=bind_claude&code=${CODE}&claude_user_id=${UID}`,
  `action=activate&code=${CODE}&claude_user_id=${UID}`,
  `action=use_card&code=${CODE}&claude_user_id=${UID}`,
  `action=redeem&code=${CODE}&claude_user_id=${UID}`,
  // Recharge actions
  `action=start_recharge&code=${CODE}`,
  `action=recharge&code=${CODE}`,
  `action=startRecharge&code=${CODE}`,
  `action=start&code=${CODE}`,
  `action=process&code=${CODE}`,
  // Check actions
  `action=check_status&code=${CODE}`,
  `action=checkStatus&code=${CODE}`,
  `action=status&code=${CODE}`,
  `action=check&code=${CODE}`,
]

async function run() {
  for (const qs of tests) {
    const url = `${BASE}?${qs}`
    try {
      const res = await fetch(url)
      const text = await res.text()
      const action = qs.split("&")[0]
      // Only log if NOT "无效的操作"
      if (!text.includes("无效的操作")) {
        console.log(`[FOUND] ${action} => ${text.substring(0, 200)}`)
      } else {
        console.log(`[FAIL] ${action} => invalid`)
      }
    } catch (e) {
      console.log(`[ERROR] ${qs.split("&")[0]} => ${e.message}`)
    }
  }
  console.log("--- Done ---")
}

run()
