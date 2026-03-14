<?php
session_start();
require_once __DIR__ . '/ChongzhiProApiClient.php';

// ---------- AJAX API ----------
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['ajax'])) {
    header('Content-Type: application/json; charset=utf-8');

    $action = $_POST['action'] ?? '';
    try {
        $client = new ChongzhiProApiClient();

        if ($action === 'verify_code') {
            $code = trim($_POST['activation_code'] ?? '');
            if ($code === '') { echo json_encode(['success'=>false,'error'=>'请输入激活码']); exit; }
            // Only check for basic requirements: not empty and reasonable length
            if (strlen($code) < 3 || strlen($code) > 50) {
                echo json_encode(['success'=>false,'error'=>'激活码长度不正确']); exit;
            }
            $session = $client->getSession();
            if (!$session) { echo json_encode(['success'=>false,'error'=>'无法获取会话，请稍后重试']); exit; }
            $verify = $client->verifyActivationCode($session, $code);
            if (!($verify['success'] ?? false)) { echo json_encode(['success'=>false,'error'=>$verify['error'] ?? '验证失败']); exit; }
            $_SESSION['cz_session'] = $session;
            $_SESSION['cz_code'] = $code;
            $_SESSION['cz_verify'] = $verify;
            $data = $verify['data'] ?? [];
            $status = $data['code_status'] ?? '';
            $email  = $data['existing_record']['bound_email_masked'] ?? '';
            $hasExisting = !empty($data['existing_record']);
            echo json_encode(['success'=>true,'status'=>$status,'is_new'=>!$hasExisting,'email'=>$email]);
            exit;
        }

        if ($action === 'submit_json') {
            $json = trim($_POST['json_token'] ?? '');
            if ($json === '') { echo json_encode(['success'=>false,'error'=>'请粘贴JSON Token']); exit; }
            if (empty($_SESSION['cz_session'])) { echo json_encode(['success'=>false,'error'=>'会话失效，请重新验证激活码']); exit; }
            $resp = $client->submitRecharge($_SESSION['cz_session'], $json);
            echo json_encode($resp, JSON_UNESCAPED_UNICODE); exit;
        }

        if ($action === 'reuse_record') {
            if (empty($_SESSION['cz_session'])) { echo json_encode(['success'=>false,'error'=>'会话失效，请重新验证激活码']); exit; }
            $resp = $client->reuseRecord($_SESSION['cz_session']);
            echo json_encode($resp, JSON_UNESCAPED_UNICODE); exit;
        }

        if ($action === 'update_token') {
            $json = trim($_POST['json_token'] ?? '');
            if ($json === '') { echo json_encode(['success'=>false,'error'=>'请粘贴JSON Token']); exit; }
            if (empty($_SESSION['cz_session']) || empty($_SESSION['cz_code'])) {
                echo json_encode(['success'=>false,'error'=>'会话失效，请重新验证激活码']); exit;
            }

            // 更新Token使用专门的updateTokenAndRecharge接口
            $resp = $client->updateTokenAndRecharge($_SESSION['cz_session'], $_SESSION['cz_code'], $json);
            echo json_encode($resp, JSON_UNESCAPED_UNICODE); exit;
        }

        echo json_encode(['success'=>false,'error'=>'未知操作']);
        exit;
    } catch (Throwable $e) {
        echo json_encode(['success'=>false,'error'=>'服务器错误：'.$e->getMessage()]);
        exit;
    }
}
// ---------- END AJAX API ----------
?>
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>GPT充值系统</title>
  <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet" />
  <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css" rel="stylesheet" />
</head>
<body class="min-h-screen bg-gray-100">
  <div class="max-w-2xl mx-auto px-4 py-8">
    <h1 class="text-3xl font-bold text-center mb-2">GPT充值系统</h1>
    <p class="text-center text-gray-500 mb-8">快速、安全的 ChatGPT Plus 充值服务</p>

    <!-- 步骤指示器 -->
    <div class="flex items-center justify-center space-x-4 mb-6">
      <div class="flex items-center">
        <div id="dot1" class="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold">1</div>
        <span class="ml-2">验证激活码</span>
      </div>
      <div id="line1" class="w-10 h-1 bg-gray-300"></div>
      <div class="flex items-center">
        <div id="dot2" class="w-8 h-8 rounded-full bg-gray-300 text-gray-700 flex items-center justify-center font-semibold">2</div>
        <span class="ml-2">用户信息</span>
      </div>
      <div id="line2" class="w-10 h-1 bg-gray-300"></div>
      <div class="flex items-center">
        <div id="dot3" class="w-8 h-8 rounded-full bg-gray-300 text-gray-700 flex items-center justify-center font-semibold">3</div>
        <span class="ml-2">完成</span>
      </div>
    </div>

    <div id="msg" class="hidden mb-4 px-4 py-3 rounded text-sm"></div>

    <!-- Step 1 -->
    <div id="step1" class="bg-white rounded shadow p-6 mb-6">
      <h2 class="text-xl font-semibold mb-4"><i class="fa-solid fa-key mr-2"></i>输入激活码</h2>
      <form id="formVerify" class="space-y-4">
        <input id="code" type="text" placeholder="请输入激活码" class="w-full border rounded px-3 py-2" required />
        <button id="btnVerify" class="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded">验证</button>
      </form>
    </div>

    <!-- Step 2 -->
    <div id="step2" class="hidden bg-white rounded shadow p-6 mb-6">
      <h2 class="text-xl font-semibold mb-4"><i class="fa-solid fa-user mr-2"></i>用户信息</h2>
      <div class="bg-gray-50 rounded p-4 mb-4">
        <div class="flex items-center mb-2">
          <i class="fa-solid fa-envelope text-gray-500 mr-2"></i>
          <span id="email" class="text-gray-800"></span>
        </div>
        <div class="flex items-center">
          <i class="fa-solid fa-info-circle text-gray-500 mr-2"></i>
          <span id="status" class="text-gray-800"></span>
        </div>
      </div>
      <div id="newUser" class="hidden">
        <label class="block text-sm font-medium mb-2"><i class="fa-solid fa-code mr-2"></i>ChatGPT JSON Token</label>
        <textarea id="json" rows="8" placeholder='粘贴从ChatGPT获取的JSON（含access_token等）' class="w-full border rounded px-3 py-2 font-mono text-sm"></textarea>
        <button id="btnSubmitJson" class="mt-3 w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded">开始充值</button>
      </div>
      <div id="oldUser" class="hidden">
        <div class="text-center mb-4">
          <div class="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-lg">
            <i class="fa-solid fa-user-check mr-2"></i>
            <span>检测到已使用的激活码</span>
          </div>
        </div>

        <!-- 复用充值按钮 -->
        <button id="btnReuse" class="w-full py-3 px-6 rounded-lg font-semibold text-white mb-3" style="background: linear-gradient(135deg, #f97316, #ea580c); border: 2px solid #ea580c;">
          <i class="fa-solid fa-rotate mr-2"></i>复用充值记录
        </button>

        <!-- 或者更新Token -->
        <div class="text-center mb-3">
          <span class="text-gray-500 text-sm">或者</span>
        </div>

        <!-- 更新Token区域 -->
        <div id="updateTokenSection" class="hidden">
          <label class="block text-sm font-medium mb-2"><i class="fa-solid fa-code mr-2"></i>更新 ChatGPT JSON Token</label>
          <textarea id="updateJson" rows="8" placeholder='粘贴新的ChatGPT JSON Token' class="w-full border rounded px-3 py-2 font-mono text-sm"></textarea>
          <div class="flex space-x-2 mt-3">
            <button id="btnUpdateToken" class="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded">
              <i class="fa-solid fa-upload mr-2"></i>更新Token
            </button>
            <button id="btnCancelUpdate" class="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 rounded">取消</button>
          </div>
        </div>

        <!-- 显示更新Token按钮 -->
        <button id="btnShowUpdate" class="w-full py-2 px-4 rounded border border-gray-300 text-gray-700 hover:bg-gray-50">
          <i class="fa-solid fa-edit mr-2"></i>更新Token
        </button>
      </div>
    </div>

    <!-- Step 3 -->
    <div id="step3" class="hidden bg-white rounded shadow p-6">
      <h2 class="text-xl font-semibold mb-4"><i class="fa-solid fa-flag-checkered mr-2"></i>操作完成</h2>

      <!-- 结果状态显示 -->
      <div id="resultStatus" class="mb-4"></div>

      <!-- 详细结果 -->
      <details class="mb-4">
        <summary class="cursor-pointer text-gray-600 hover:text-gray-800">查看详细结果</summary>
        <pre id="result" class="bg-gray-50 rounded p-4 text-sm overflow-auto mt-2 max-h-64"></pre>
      </details>

      <button id="btnReset" class="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded">
        <i class="fa-solid fa-refresh mr-2"></i>重新开始
      </button>
    </div>
  </div>

  <script>
    const $ = (id) => document.getElementById(id);
    const setStep = (n) => {
      $('dot1').className = 'w-8 h-8 rounded-full ' + (n>=1?'bg-blue-600 text-white':'bg-gray-300 text-gray-700') + ' flex items-center justify-center font-semibold';
      $('dot2').className = 'w-8 h-8 rounded-full ' + (n>=2?'bg-blue-600 text-white':'bg-gray-300 text-gray-700') + ' flex items-center justify-center font-semibold';
      $('dot3').className = 'w-8 h-8 rounded-full ' + (n>=3?'bg-blue-600 text-white':'bg-gray-300 text-gray-700') + ' flex items-center justify-center font-semibold';
      $('line1').className = 'w-10 h-1 ' + (n>=2?'bg-blue-600':'bg-gray-300');
      $('line2').className = 'w-10 h-1 ' + (n>=3?'bg-blue-600':'bg-gray-300');
      $('step1').classList.toggle('hidden', n!==1);
      $('step2').classList.toggle('hidden', n!==2);
      $('step3').classList.toggle('hidden', n!==3);
    };
    const showMsg = (t, ok=false)=>{ const b=$('msg'); b.classList.remove('hidden'); b.className='mb-4 px-4 py-3 rounded text-sm '+(ok?'bg-green-100 text-green-800':'bg-red-100 text-red-800'); b.textContent=t; };
    const hideMsg = ()=>$('msg').classList.add('hidden');

    // 显示结果状态
    const showResult = (data) => {
      const success = data.success || false;
      const statusDiv = $('resultStatus');

      if (success) {
        statusDiv.innerHTML = `
          <div class="flex items-center p-4 bg-green-100 border border-green-400 rounded">
            <i class="fa-solid fa-check-circle text-green-600 text-2xl mr-3"></i>
            <div>
              <h3 class="font-semibold text-green-800">操作成功！</h3>
              <p class="text-green-700 text-sm">${data.message || '充值已完成'}</p>
            </div>
          </div>
        `;
      } else {
        statusDiv.innerHTML = `
          <div class="flex items-center p-4 bg-red-100 border border-red-400 rounded">
            <i class="fa-solid fa-exclamation-triangle text-red-600 text-2xl mr-3"></i>
            <div>
              <h3 class="font-semibold text-red-800">操作失败</h3>
              <p class="text-red-700 text-sm">${data.error || '未知错误'}</p>
            </div>
          </div>
        `;
      }

      $('result').textContent = JSON.stringify(data, null, 2);
    };

    // Step1: 验证
    $('formVerify').addEventListener('submit', async (e)=>{
      e.preventDefault(); hideMsg();
      const code = $('code').value.trim(); if(!code){showMsg('请输入激活码');return;}
      const fd = new FormData(); fd.append('ajax','1'); fd.append('action','verify_code'); fd.append('activation_code', code);
      try{
        const r = await fetch('', {method:'POST', body:fd}); const j = await r.json();
        if(!j.success){ showMsg(j.error||'验证失败'); return; }
        $('email').textContent = j.email || '（无邮箱）';
        $('status').textContent = '状态：'+(j.status||'未知');
        if(j.is_new){ $('newUser').classList.remove('hidden'); $('oldUser').classList.add('hidden'); }
        else { $('oldUser').classList.remove('hidden'); $('newUser').classList.add('hidden'); }
        setStep(2);
      }catch(err){ showMsg('网络错误：'+err.message); }
    });

    // 新用户：提交JSON
    $('btnSubmitJson').addEventListener('click', async (e)=>{
      e.preventDefault();
      hideMsg();
      const json=$('json').value.trim();
      if(!json){showMsg('请输入JSON Token');return;}

      const btn = $('btnSubmitJson');
      btn.disabled = true;
      btn.textContent = '充值中...';

      const fd=new FormData();
      fd.append('ajax','1');
      fd.append('action','submit_json');
      fd.append('json_token', json);

      try{
        const r=await fetch('',{method:'POST',body:fd});
        const j=await r.json();
        showResult(j);
        setStep(3);
      }catch(err){
        showMsg('网络错误：'+err.message);
      } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-rocket mr-2"></i>开始充值';
      }
    });

    // 旧用户：复用
    $('btnReuse').addEventListener('click', async (e)=>{
      e.preventDefault(); // 防止表单提交
      e.stopPropagation(); // 防止事件冒泡
      hideMsg();
      const btn = $('btnReuse');
      btn.disabled = true; // 防止重复点击
      btn.textContent = '处理中...';

      const fd=new FormData();
      fd.append('ajax','1');
      fd.append('action','reuse_record');

      try{
        const r=await fetch('',{method:'POST',body:fd});
        const j=await r.json();
        showResult(j);
        setStep(3);
      }catch(err){
        showMsg('网络错误：'+err.message);
      } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-rotate mr-2"></i>复用充值记录';
      }
    });

    // 显示更新Token区域
    $('btnShowUpdate').addEventListener('click', ()=>{
      $('updateTokenSection').classList.remove('hidden');
      $('btnShowUpdate').classList.add('hidden');
    });

    // 取消更新Token
    $('btnCancelUpdate').addEventListener('click', ()=>{
      $('updateTokenSection').classList.add('hidden');
      $('btnShowUpdate').classList.remove('hidden');
      $('updateJson').value = '';
    });

    // 更新Token
    $('btnUpdateToken').addEventListener('click', async (e)=>{
      e.preventDefault();
      hideMsg();
      const json = $('updateJson').value.trim();
      if(!json){ showMsg('请输入JSON Token'); return; }

      const btn = $('btnUpdateToken');
      btn.disabled = true;
      btn.textContent = '更新中...';

      const fd = new FormData();
      fd.append('ajax','1');
      fd.append('action','update_token');
      fd.append('json_token', json);

      try{
        const r = await fetch('',{method:'POST',body:fd});
        const j = await r.json();
        showResult(j);
        setStep(3);
      }catch(err){
        showMsg('网络错误：'+err.message);
      } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-upload mr-2"></i>更新Token';
      }
    });

    // 重置
    $('btnReset').addEventListener('click', ()=>{
      hideMsg();
      $('code').value='';
      $('json').value='';
      $('updateJson').value='';
      $('updateTokenSection').classList.add('hidden');
      $('btnShowUpdate').classList.remove('hidden');
      setStep(1);
    });

    setStep(1);
  </script>
</body>
</html>
