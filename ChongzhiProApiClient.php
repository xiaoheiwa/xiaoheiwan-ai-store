<?php

/**
 * ChongzhiPro API客户端类
 * 用于调用 https://chongzhi.pro/ 的充值接口
 * 
 * 使用示例：
 * $client = new ChongzhiProApiClient();
 * $session = $client->getSession();
 * $result = $client->verifyActivationCode($session, 'CARD-XXXX-XXXX-XXXX');
 * if ($result['success']) {
 *     $reuse = $client->reuseRecord($session);
 *     $recharge = $client->submitRecharge($session, $jsonToken);
 * }
 */
class ChongzhiProApiClient
{
    private $baseUrl = 'https://chongzhi.pro';
    private $timeout = 30;
    private $userAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.1 Mobile/15E148 Safari/604.1';

    /**
     * 构造函数
     * @param string $baseUrl 可选，自定义基础URL
     */
    public function __construct($baseUrl = null)
    {
        if ($baseUrl) {
            $this->baseUrl = rtrim($baseUrl, '/');
        }
    }

    /**
     * 获取Session ID
     * 访问主页获取 ios_gpt_session Cookie
     * 
     * @return string|null Session ID 或 null（失败时）
     */
    public function getSession()
    {
        $url = $this->baseUrl . '/';
        
        $headers = [
            'Accept-Encoding: gzip, deflate, br',
            'User-Agent: ' . $this->userAgent,
            'Host: ' . parse_url($this->baseUrl, PHP_URL_HOST),
            'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language: zh-CN,zh-Hans;q=0.9',
        ];

        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HEADER => true,
            CURLOPT_HTTPHEADER => $headers,
            CURLOPT_TIMEOUT => $this->timeout,
            CURLOPT_SSL_VERIFYPEER => false,
            CURLOPT_SSL_VERIFYHOST => false,
            CURLOPT_FOLLOWLOCATION => true,
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode !== 200 || !$response) {
            return null;
        }

        // 提取 ios_gpt_session
        if (preg_match('/ios_gpt_session=([^;]+)/', $response, $matches)) {
            return $matches[1];
        }

        return null;
    }

    /**
     * 验证激活码
     * 
     * @param string $session Session ID
     * @param string $activationCode 激活码
     * @return array 验证结果
     */
    public function verifyActivationCode($session, $activationCode)
    {
        $url = $this->baseUrl . '/api-verify.php';
        
        $payload = json_encode([
            'activation_code' => $activationCode
        ]);

        $headers = [
            'User-Agent: ' . $this->userAgent,
            'Accept: application/json',
            'Referer: ' . $this->baseUrl . '/',
            'Content-Type: application/json',
            'Origin: ' . $this->baseUrl,
            'Host: ' . parse_url($this->baseUrl, PHP_URL_HOST),
            'Accept-Encoding: gzip, deflate, br',
            'Accept-Language: zh-CN,zh-Hans;q=0.9',
            'Cookie: ios_gpt_session=' . $session,
        ];

        return $this->sendRequest($url, 'POST', $payload, $headers);
    }

    /**
     * 复用充值记录
     * 
     * @param string $session Session ID
     * @return array 复用结果
     */
    public function reuseRecord($session)
    {
        $url = $this->baseUrl . '/api-recharge-reuse.php';
        
        $payload = json_encode([
            'action' => 'reuse_record'
        ]);

        $headers = [
            'User-Agent: ' . $this->userAgent,
            'Accept-Encoding: gzip, deflate, br',
            'Accept-Language: zh-CN,zh-Hans;q=0.9',
            'Content-Type: application/json',
            'Referer: ' . $this->baseUrl . '/',
            'Host: ' . parse_url($this->baseUrl, PHP_URL_HOST),
            'Accept: */*',
            'Origin: ' . $this->baseUrl,
            'Cookie: ios_gpt_session=' . $session,
        ];

        return $this->sendRequest($url, 'POST', $payload, $headers);
    }

    /**
     * 提交第一次充值
     * 
     * @param string $session Session ID
     * @param string $userDataJson 用户JSON Token数据
     * @return array 充值结果
     */
    public function submitRecharge($session, $userDataJson)
    {
        $url = $this->baseUrl . '/simple-submit-recharge.php';
        
        $payload = json_encode([
            'user_data' => $userDataJson
        ]);

        $headers = [
            'Origin: ' . $this->baseUrl,
            'User-Agent: ' . $this->userAgent,
            'Accept: application/json',
            'Host: ' . parse_url($this->baseUrl, PHP_URL_HOST),
            'Content-Type: application/json',
            'Accept-Language: zh-CN,zh-Hans;q=0.9',
            'Referer: ' . $this->baseUrl . '/',
            'Accept-Encoding: gzip, deflate, br',
            'Cookie: ios_gpt_session=' . $session,
        ];

        return $this->sendRequest($url, 'POST', $payload, $headers);
    }

    /**
     * 更新Token并充值
     * 
     * @param string $session Session ID
     * @param string $cardCode 卡密
     * @param string $userDataJson 用户JSON Token数据
     * @return array 充值结果
     */
    public function updateTokenAndRecharge($session, $cardCode, $userDataJson)
    {
        $url = $this->baseUrl . '/api-recharge-reuse.php';
        
        $payload = json_encode([
            'action' => 'update_token_and_recharge',
            'card_code' => $cardCode,
            'json_data' => $userDataJson
        ]);

        $headers = [
            'User-Agent: ' . $this->userAgent,
            'Accept-Encoding: gzip, deflate, br',
            'Accept-Language: zh-CN,zh-Hans;q=0.9',
            'Content-Type: application/json',
            'Referer: ' . $this->baseUrl . '/',
            'Host: ' . parse_url($this->baseUrl, PHP_URL_HOST),
            'Accept: */*',
            'Origin: ' . $this->baseUrl,
            'Cookie: ios_gpt_session=' . $session,
        ];

        return $this->sendRequest($url, 'POST', $payload, $headers);
    }

    /**
     * 记录调试日志
     */
    private function writeDebugLog($message, $data = null) {
        $timestamp = date('Y-m-d H:i:s');
        $logEntry = "[$timestamp] [ChongzhiProApiClient] $message\n";

        if ($data !== null) {
            if (is_string($data)) {
                // 对于字符串，显示原始内容和十六进制
                $logEntry .= "字符串内容: " . $data . "\n";
                $logEntry .= "十六进制: " . bin2hex($data) . "\n";
                $logEntry .= "编码检测: " . (mb_detect_encoding($data, ['UTF-8', 'GBK', 'GB2312', 'ISO-8859-1'], true) ?: 'unknown') . "\n";
            } else {
                $logEntry .= "数据结构: " . var_export($data, true) . "\n";
                $logEntry .= "JSON格式: " . json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "\n";
            }
        }

        $logEntry .= str_repeat('=', 80) . "\n";

        // 确保日志文件使用UTF-8编码
        file_put_contents('api_debug.log', $logEntry, FILE_APPEND | LOCK_EX);
    }

    /**
     * 发送HTTP请求
     *
     * @param string $url 请求URL
     * @param string $method 请求方法
     * @param string $data 请求数据
     * @param array $headers 请求头
     * @return array 响应结果
     */
    private function sendRequest($url, $method = 'GET', $data = null, $headers = [])
    {
        $ch = curl_init();

        curl_setopt_array($ch, [
            CURLOPT_URL => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => $this->timeout,
            CURLOPT_SSL_VERIFYPEER => false,
            CURLOPT_SSL_VERIFYHOST => false,
            CURLOPT_HTTPHEADER => $headers,
            CURLOPT_ENCODING => '', // 自动处理gzip解压缩
        ]);

        if ($method === 'POST') {
            curl_setopt($ch, CURLOPT_POST, true);
            if ($data) {
                curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
            }
        }

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $contentType = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
        $error = curl_error($ch);
        curl_close($ch);



        if ($error) {
            return [
                'success' => false,
                'error' => 'CURL Error: ' . $error,
                'http_code' => $httpCode
            ];
        }

        $result = json_decode($response, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            return [
                'success' => false,
                'error' => 'JSON解析失败: ' . json_last_error_msg(),
                'raw_response' => $response,
                'http_code' => $httpCode
            ];
        }

        $result['http_code'] = $httpCode;
        return $result;
    }

    /**
     * 完整的充值流程
     * 自动执行：获取Session -> 验证卡密 -> 复用/充值
     * 
     * @param string $activationCode 激活码
     * @param string $userDataJson 用户JSON Token（可选，用于第一次充值）
     * @return array 完整流程结果
     */
    public function fullRechargeProcess($activationCode, $userDataJson = null)
    {
        $result = [
            'success' => false,
            'steps' => [],
            'final_result' => null
        ];

        // 步骤1：获取Session
        $session = $this->getSession();
        if (!$session) {
            $result['steps'][] = ['step' => 'get_session', 'success' => false, 'error' => '获取Session失败'];
            return $result;
        }
        $result['steps'][] = ['step' => 'get_session', 'success' => true, 'session' => $session];

        // 步骤2：验证激活码
        $verifyResult = $this->verifyActivationCode($session, $activationCode);
        $result['steps'][] = ['step' => 'verify_code', 'success' => $verifyResult['success'] ?? false, 'result' => $verifyResult];
        
        if (!($verifyResult['success'] ?? false)) {
            return $result;
        }

        // 步骤3：根据卡密状态决定操作
        $codeStatus = $verifyResult['data']['code_status'] ?? '';
        
        if ($codeStatus === 'used') {
            // 已使用的卡密，尝试复用
            $reuseResult = $this->reuseRecord($session);
            $result['steps'][] = ['step' => 'reuse_record', 'success' => $reuseResult['success'] ?? false, 'result' => $reuseResult];
            $result['final_result'] = $reuseResult;
            $result['success'] = $reuseResult['success'] ?? false;
        } elseif ($codeStatus === 'active' && $userDataJson) {
            // 未使用的卡密，进行第一次充值
            $rechargeResult = $this->submitRecharge($session, $userDataJson);
            $result['steps'][] = ['step' => 'submit_recharge', 'success' => $rechargeResult['success'] ?? false, 'result' => $rechargeResult];
            $result['final_result'] = $rechargeResult;
            $result['success'] = $rechargeResult['success'] ?? false;
        } else {
            $result['steps'][] = ['step' => 'decision', 'success' => false, 'error' => '卡密状态异常或缺少用户数据'];
        }

        return $result;
    }

    /**
     * 设置请求超时时间
     *
     * @param int $timeout 超时时间（秒）
     */
    public function setTimeout($timeout)
    {
        $this->timeout = $timeout;
    }

    /**
     * 设置User-Agent
     *
     * @param string $userAgent User-Agent字符串
     */
    public function setUserAgent($userAgent)
    {
        $this->userAgent = $userAgent;
    }

    /**
     * 获取当前配置信息
     *
     * @return array 配置信息
     */
    public function getConfig()
    {
        return [
            'base_url' => $this->baseUrl,
            'timeout' => $this->timeout,
            'user_agent' => $this->userAgent
        ];
    }
}

// 使用示例
if (basename(__FILE__) === basename($_SERVER['SCRIPT_NAME'])) {
    echo "ChongzhiPro API客户端使用示例:\n\n";

    echo "// 基础使用\n";
    echo "\$client = new ChongzhiProApiClient();\n";
    echo "\$session = \$client->getSession();\n";
    echo "if (\$session) {\n";
    echo "    echo \"Session: \" . \$session . \"\\n\";\n";
    echo "    \n";
    echo "    // 验证激活码\n";
    echo "    \$result = \$client->verifyActivationCode(\$session, 'CARD-XXXX-XXXX-XXXX');\n";
    echo "    if (\$result['success']) {\n";
    echo "        if (\$result['data']['code_status'] === 'used') {\n";
    echo "            // 复用已有记录\n";
    echo "            \$reuse = \$client->reuseRecord(\$session);\n";
    echo "            print_r(\$reuse);\n";
    echo "        } elseif (\$result['data']['code_status'] === 'active') {\n";
    echo "            // 第一次充值\n";
    echo "            \$jsonToken = '{\"access_token\":\"...\",\"user\":{\"email\":\"...\"}}'; // ChatGPT JSON数据\n";
    echo "            \$recharge = \$client->submitRecharge(\$session, \$jsonToken);\n";
    echo "            print_r(\$recharge);\n";
    echo "        }\n";
    echo "    }\n";
    echo "}\n\n";

    echo "// 完整流程（推荐）\n";
    echo "\$client = new ChongzhiProApiClient();\n";
    echo "\$jsonToken = '{\"access_token\":\"...\",\"user\":{\"email\":\"...\"}}'; // ChatGPT JSON数据\n";
    echo "\$result = \$client->fullRechargeProcess('CARD-XXXX-XXXX-XXXX', \$jsonToken);\n";
    echo "print_r(\$result);\n";
}
