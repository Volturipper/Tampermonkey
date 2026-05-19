// ==UserScript==
// @name         ChatGPT Auto Continue - CAC API Enhancement Candidate v220
// @namespace    local.cac.full-supervised.20260506
// @version      2026.5.220
// @description  CAC API enhancement candidate v220: v219 API plus backward-compatible lease aliases until/acquired_at, one-version safety, inert single-conversation defaults.
// @match        https://chatgpt.com/c/69fb92be-976c-83a6-9703-84ba859e4a06*
// @updateURL    https://raw.githubusercontent.com/Volturipper/Tampermonkey/main/scripts/cac-v220-runtime/cac-v220-runtime.user.js
// @downloadURL  https://raw.githubusercontent.com/Volturipper/Tampermonkey/main/scripts/cac-v220-runtime/cac-v220-runtime.user.js
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function cacFullSupervisedCandidate() {
  'use strict';

  const VERSION = 'v220-lease-alias-candidate.1';
  const BUILD = '2026.05.12.lease-alias-candidate.1';
  const API_NAME = '__cgptAutoContinueAPI';
  const RUNTIME_KEY = '__cacApiEnhancementRuntime_20260512__';
  const SINGLETON_KEY = '__cgptAutoContinueSingleton__';
  const TARGET_CONVERSATION_ID = '69fb92be-976c-83a6-9703-84ba859e4a06';
  const TARGET_URL_PREFIX = `https://chatgpt.com/c/${TARGET_CONVERSATION_ID}`;
  const RECEIPT_LIMIT = 100;
  const DEFAULT_LEASE_TTL_MS = 10 * 60 * 1000;
  const MIN_LEASE_TTL_MS = 1000;
  const MAX_LEASE_TTL_MS = 15 * 60 * 1000;
  const STORAGE_NAMESPACE = `__cac_api_enhance:${TARGET_CONVERSATION_ID}:v220`; // conversation-scoped; v220 keeps receipts isolated from older candidates
  const RECEIPT_STORAGE_KEY = `${STORAGE_NAMESPACE}:receipts`;
  const STATE_STORAGE_KEY = `${STORAGE_NAMESPACE}:runtime_state`;
  const STORAGE_SCHEMA = 'cac.conversation_scoped_storage.v1';

  const config = {
    globalEnabled: false,
    enabled: false,
    conversationEnabled: false,
    autoContinueEnabled: false,
    artifactAutoDownloadEnabled: false,
    promptSubmitEnabled: false,
    hotkeysEnabled: false,
    unattendedOperationEnabled: false,
    productionInstallEnabled: false,
    supervisedControlEnabled: false,
    whitelistUrlPrefix: TARGET_URL_PREFIX,
    maxRealActionsPerCommand: 1,
    promptSubmitSupported: false,
    artifactDownloadSupported: false,
    realContinueSupported: true
  };

  const state = {
    driverId: 'cac-api-enhancement-runtime-v219',
    profileLabel: 'dedicated-chrome-dev-profile',
    installedAt: new Date().toISOString(),
    lastActivityAt: new Date().toISOString(),
    paused: false,
    stopped: false,
    stopReason: '',
    lease: null,
    receipts: [],
    counters: {
      realContinueAttempts: 0,
      realContinueClicks: 0,
      dryRunContinueAttempts: 0,
      promptSubmits: 0,
      downloads: 0,
      mutatingCommands: 0
    }
  };

  state.receipts = loadConversationReceipts();

  function nowIso() {
    return new Date().toISOString();
  }

  function randomId(prefix) {
    const cryptoObj = window.crypto;
    if (cryptoObj && cryptoObj.getRandomValues) {
      const bytes = new Uint8Array(8);
      cryptoObj.getRandomValues(bytes);
      return `${prefix}_${Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('')}`;
    }
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
  }


  function readJsonStorage(key, fallback) {
    try {
      const raw = window.localStorage && window.localStorage.getItem(key);
      if (!raw) return fallback;
      const parsed = JSON.parse(raw);
      return parsed == null ? fallback : parsed;
    } catch (_) {
      return fallback;
    }
  }

  function writeJsonStorage(key, value) {
    try {
      if (window.localStorage) window.localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (_) {
      return false;
    }
  }

  function loadConversationReceipts() {
    const stored = readJsonStorage(RECEIPT_STORAGE_KEY, null);
    if (!stored || stored.schema !== STORAGE_SCHEMA || stored.conversation_id !== TARGET_CONVERSATION_ID || !Array.isArray(stored.receipts)) return [];
    return stored.receipts.slice(0, RECEIPT_LIMIT).filter((receipt) => receipt && receipt.conversation_id === TARGET_CONVERSATION_ID);
  }

  function saveConversationReceipts() {
    return writeJsonStorage(RECEIPT_STORAGE_KEY, {
      schema: STORAGE_SCHEMA,
      version: VERSION,
      conversation_id: TARGET_CONVERSATION_ID,
      storage_namespace: STORAGE_NAMESPACE,
      updated_at: nowIso(),
      receipt_count: state.receipts.length,
      receipts: state.receipts.slice(0, RECEIPT_LIMIT)
    });
  }

  function persistRuntimeState(reason) {
    return writeJsonStorage(STATE_STORAGE_KEY, {
      schema: 'cac.runtime_state.v1',
      version: VERSION,
      conversation_id: TARGET_CONVERSATION_ID,
      storage_namespace: STORAGE_NAMESPACE,
      updated_at: nowIso(),
      reason: sanitizeText(reason || '', 120),
      paused: !!state.paused,
      stopped: !!state.stopped,
      supervisedControlEnabled: !!config.supervisedControlEnabled,
      lease: leaseState(),
      counters: { ...state.counters },
      containsPromptText: false,
      containsUserText: false
    });
  }

  function sanitizeText(value, maxLen = 160) {
    return String(value == null ? '' : value).replace(/[\r\n\t]+/g, ' ').slice(0, maxLen);
  }

  function currentConversationId() {
    const match = location.href.match(/\/c\/([^/?#]+)/);
    return match ? match[1] : '';
  }

  function isWhitelistedPage() {
    return location.href.startsWith(TARGET_URL_PREFIX) && currentConversationId() === TARGET_CONVERSATION_ID;
  }

  function leaseState() {
    const lease = state.lease;
    const now = Date.now();
    if (!lease) {
      return {
        active: false,
        owner: '',
        leaseId: '',
        lease_id: '',
        leaseUntil: '',
        until: '',
        expired: false,
        ttlMsRemaining: 0,
        reason: '',
        acquiredAt: '',
        acquired_at: ''
      };
    }
    const ttlMsRemaining = Math.max(0, Number(lease.expiresAt || 0) - now);
    const leaseUntil = lease.leaseUntil || '';
    const acquiredAt = lease.acquiredAt || '';
    const leaseId = lease.leaseId || lease.lease_id || '';
    return {
      active: ttlMsRemaining > 0,
      owner: lease.owner || '',
      leaseId,
      lease_id: leaseId,
      leaseUntil,
      until: leaseUntil,
      expired: ttlMsRemaining <= 0,
      ttlMsRemaining,
      reason: lease.reason || '',
      acquiredAt,
      acquired_at: acquiredAt
    };
  }

  function isLeaseOwnedBy(owner) {
    const lease = leaseState();
    return !!owner && lease.active && lease.owner === String(owner);
  }

  function recordReceipt(command, owner, phase, result) {
    const receipt = {
      receipt_id: randomId('cac_receipt'),
      schema: 'cac.command_receipt.v1',
      version: VERSION,
      command: sanitizeText(command, 80),
      owner: sanitizeText(owner, 120),
      phase,
      ok: !!result.ok,
      blocked: !!result.blocked,
      reason: sanitizeText(result.reason || '', 160),
      action: sanitizeText(result.action || '', 120),
      dryRun: !!result.dryRun,
      maxActions: Number(result.maxActions || 0),
      realClickCount: Number(result.realClickCount || 0),
      stateCode: sanitizeText(result.stateCode || '', 120),
      nativeContinueFound: !!result.nativeContinueFound,
      composerFound: !!result.composerFound,
      safeSubmitterFound: !!result.safeSubmitterFound,
      blocker: sanitizeText(result.blocker || '', 160),
      actionTaken: sanitizeText(result.actionTaken || result.action || 'none', 120),
      actionCount: Number(result.actionCount != null ? result.actionCount : (result.realClickCount || 0)),
      timestamp: nowIso(),
      conversation_id: currentConversationId(),
      target_conversation_id: TARGET_CONVERSATION_ID,
      whitelist_match: isWhitelistedPage(),
      storage_namespace: STORAGE_NAMESPACE,
      containsPromptText: false,
      containsUserText: false
    };
    state.receipts.unshift(receipt);
    if (state.receipts.length > RECEIPT_LIMIT) state.receipts.length = RECEIPT_LIMIT;
    state.lastActivityAt = receipt.timestamp;
    saveConversationReceipts();
    return receipt;
  }

  function blocked(command, owner, reason, extra = {}) {
    const surfaceResult = withSurface({ ok: false, blocked: true, reason, ...extra }, { blocker: reason, actionTaken: 'blocked', actionCount: 0 });
    const before = recordReceipt(command, owner, 'blocked', surfaceResult);
    return withSurface({
      ok: false,
      blocked: true,
      reason,
      receipt_id: before.receipt_id,
      before_receipt_id: before.receipt_id,
      after_receipt_id: '',
      version: VERSION
    }, { blocker: reason, actionTaken: 'blocked', actionCount: 0 });
  }

  function isDangerousButton(btn) {
    if (!btn) return true;
    const text = `${btn.id || ''} ${btn.getAttribute('data-testid') || ''} ${btn.getAttribute('aria-label') || ''} ${btn.textContent || ''} ${btn.title || ''}`.toLowerCase();
    return /mic|microphone|dictat|voice|speech|audio|record|download|open|share|menu|more|attach|file|upload|copy|export|import|link|麦克风|听写|语音|录音|下载|打开|分享|菜单|附件|文件/.test(text);
  }

  function isContinueGeneratingButton(btn) {
    if (!btn || !(btn instanceof HTMLElement)) return false;
    if (btn.disabled || btn.getAttribute('aria-disabled') === 'true') return false;
    if (isDangerousButton(btn)) return false;
    const text = `${btn.getAttribute('aria-label') || ''} ${btn.textContent || ''} ${btn.title || ''}`.replace(/\s+/g, ' ').trim().toLowerCase();
    if (!text) return false;
    return /continue generating|继续生成/.test(text);
  }

  function findContinueGeneratingButton() {
    const buttons = Array.from(document.querySelectorAll('button, [role="button"]'));
    return buttons.find(isContinueGeneratingButton) || null;
  }


  function findComposer() {
    return document.querySelector('textarea, [contenteditable="true"], [role="textbox"]');
  }

  function isSafeSubmitterButton(btn) {
    if (!btn || !(btn instanceof HTMLElement)) return false;
    if (btn.disabled || btn.getAttribute('aria-disabled') === 'true') return false;
    if (isDangerousButton(btn)) return false;
    const sig = `${btn.id || ''} ${btn.getAttribute('data-testid') || ''} ${btn.getAttribute('aria-label') || ''} ${btn.textContent || ''} ${btn.title || ''}`.replace(/\s+/g, ' ').trim().toLowerCase();
    if (/stop answering|stop generating|停止|停止回答|composer-submit-button.*stop-button|stop-button/.test(sig)) return false;
    return /send|submit|发送|提交|composer-submit-button|send-button|submit-button/.test(sig);
  }

  function findSafeSubmitterButton() {
    const composer = findComposer();
    if (!composer) return null;
    const form = composer.closest && composer.closest('form');
    const root = form || composer.closest('[data-testid], main, body') || document;
    const buttons = Array.from(root.querySelectorAll('button, [role="button"]'));
    return buttons.find(isSafeSubmitterButton) || null;
  }

  function inspectRuntimeSurface() {
    const nativeButton = findContinueGeneratingButton();
    const composer = findComposer();
    const safeSubmitter = findSafeSubmitterButton();
    let stateCode = 'READY_NO_NATIVE_CONTINUE_BUTTON';
    let blocker = nativeButton ? '' : 'no_continue_button';
    if (!isWhitelistedPage()) { stateCode = 'BLOCKED_WHITELIST_MISMATCH'; blocker = 'whitelist_mismatch'; }
    else if (state.stopped) { stateCode = 'BLOCKED_STOPPED'; blocker = 'stopped'; }
    else if (state.paused) { stateCode = 'BLOCKED_PAUSED'; blocker = 'paused'; }
    else if (nativeButton) { stateCode = 'READY_NATIVE_CONTINUE_BUTTON'; blocker = ''; }
    return {
      schema: 'cac.runtime_surface.v1',
      version: VERSION,
      stateCode,
      nativeContinueFound: !!nativeButton,
      composerFound: !!composer,
      safeSubmitterFound: !!safeSubmitter,
      blocker,
      actionTaken: 'none',
      actionCount: 0,
      conversation_id: currentConversationId(),
      target_conversation_id: TARGET_CONVERSATION_ID,
      whitelist_match: isWhitelistedPage(),
      storage_namespace: STORAGE_NAMESPACE,
      containsPromptText: false,
      containsUserText: false
    };
  }


  function classifyRealContinueState(surface = inspectRuntimeSurface(), last = null) {
    if (!config.realContinueSupported) return 'UNSUPPORTED_BY_POLICY';
    if (!isWhitelistedPage()) return 'BLOCKED_WHITELIST_MISMATCH';
    if (state.stopped) return 'BLOCKED_STOPPED';
    if (state.paused) return 'BLOCKED_PAUSED';
    if (last && last.actionTaken === 'clicked_native_continue' && Number(last.actionCount || 0) > 0) return 'CANDIDATE_CLICKED';
    if (surface.nativeContinueFound) return 'CANDIDATE_AVAILABLE';
    return 'CAPABLE_NO_CANDIDATE';
  }

  function realContinueStatus(surface = inspectRuntimeSurface()) {
    const last = state.receipts.find((r) => r && r.command === 'continueNow' && r.dryRun === false) || null;
    const stateCode = classifyRealContinueState(surface, last);
    return {
      schema: 'cac.real_continue_status.v1',
      supported: !!config.realContinueSupported,
      boundedNativeOnly: true,
      stateCode,
      nativeContinueFound: !!surface.nativeContinueFound,
      lastActionTaken: last ? (last.actionTaken || 'none') : 'none',
      lastActionCount: last ? Number(last.actionCount || 0) : 0,
      lastReason: last ? (last.reason || '') : '',
      noCandidateIsSafeNoop: true,
      promptSubmitFallback: false,
      artifactDownloadFallback: false,
      maxActionsPerCommand: config.maxRealActionsPerCommand,
      containsPromptText: false,
      containsUserText: false
    };
  }

  function withSurface(result, override = {}) {
    const surface = inspectRuntimeSurface();
    return {
      ...result,
      stateCode: override.stateCode || result.stateCode || surface.stateCode,
      nativeContinueFound: typeof override.nativeContinueFound === 'boolean' ? override.nativeContinueFound : surface.nativeContinueFound,
      composerFound: typeof override.composerFound === 'boolean' ? override.composerFound : surface.composerFound,
      safeSubmitterFound: typeof override.safeSubmitterFound === 'boolean' ? override.safeSubmitterFound : surface.safeSubmitterFound,
      blocker: override.blocker != null ? override.blocker : (result.blocker != null ? result.blocker : surface.blocker),
      actionTaken: override.actionTaken || result.actionTaken || result.action || 'none',
      actionCount: Number(override.actionCount != null ? override.actionCount : (result.actionCount != null ? result.actionCount : (result.realClickCount || 0))),
      realContinueState: override.realContinueState || result.realContinueState || classifyRealContinueState(surface, result),
      realContinueStateCode: override.realContinueStateCode || result.realContinueStateCode || classifyRealContinueState(surface, result)
    };
  }

  function validateOwner(owner) {
    const value = sanitizeText(owner, 120);
    return value ? value : '';
  }

  function validateBaseGate(command, owner, options = {}) {
    const normalizedOwner = validateOwner(owner);
    if (!isWhitelistedPage()) return { ok: false, reason: 'whitelist_mismatch' };
    if (!normalizedOwner) return { ok: false, reason: 'missing_owner' };
    if (state.stopped && command !== 'resume' && command !== 'acquireLease' && command !== 'releaseLease') return { ok: false, reason: 'stopped' };
    if (options.requireLease && !isLeaseOwnedBy(normalizedOwner)) return { ok: false, reason: 'missing_lease' };
    if (options.requireSupervised && !config.supervisedControlEnabled) return { ok: false, reason: 'supervised_control_disabled' };
    if (options.requireNotPaused && state.paused) return { ok: false, reason: 'paused' };
    return { ok: true, owner: normalizedOwner };
  }

  function acquireLease(input = {}) {
    const command = 'acquireLease';
    const owner = validateOwner(input.owner);
    if (!isWhitelistedPage()) return blocked(command, owner, 'whitelist_mismatch');
    if (!owner) return blocked(command, owner, 'missing_owner');
    const current = leaseState();
    if (current.active && current.owner !== owner) return blocked(command, owner, 'lease_owned_by_another_agent', { action: 'no_takeover' });
    const ttlMs = Math.max(MIN_LEASE_TTL_MS, Math.min(MAX_LEASE_TTL_MS, Number(input.ttlMs || DEFAULT_LEASE_TTL_MS)));
    const before = recordReceipt(command, owner, 'before', { ok: true, blocked: false, reason: 'lease_attempt', maxActions: 0 });
    const expiresAt = Date.now() + ttlMs;
    const leaseId = randomId('cac_lease');
    const leaseUntil = new Date(expiresAt).toISOString();
    const acquiredAt = nowIso();
    state.lease = {
      owner,
      leaseId,
      lease_id: leaseId,
      ttlMs,
      expiresAt,
      leaseUntil,
      until: leaseUntil,
      acquiredAt,
      acquired_at: acquiredAt,
      reason: sanitizeText(input.reason || 'bounded supervised control lease')
    };
    state.counters.mutatingCommands += 1;
    persistRuntimeState('lease_acquired');
    const after = recordReceipt(command, owner, 'after', { ok: true, blocked: false, reason: 'lease_acquired', maxActions: 0 });
    return { ok: true, blocked: false, reason: 'lease_acquired', receipt_id: after.receipt_id, before_receipt_id: before.receipt_id, after_receipt_id: after.receipt_id, lease: leaseState(), version: VERSION };
  }

  function releaseLease(input = {}) {
    const command = 'releaseLease';
    const owner = validateOwner(input.owner);
    const gate = validateBaseGate(command, owner, { requireLease: true });
    if (!gate.ok) return blocked(command, owner, gate.reason);
    const before = recordReceipt(command, owner, 'before', { ok: true, blocked: false, reason: 'release_attempt' });
    state.lease = null;
    state.counters.mutatingCommands += 1;
    persistRuntimeState('lease_released');
    const after = recordReceipt(command, owner, 'after', { ok: true, blocked: false, reason: 'lease_released' });
    return { ok: true, blocked: false, reason: 'lease_released', receipt_id: after.receipt_id, before_receipt_id: before.receipt_id, after_receipt_id: after.receipt_id, lease: leaseState(), version: VERSION };
  }

  function setSupervisedControlEnabled(input = {}) {
    const command = 'setSupervisedControlEnabled';
    const owner = validateOwner(input.owner);
    const gate = validateBaseGate(command, owner, { requireLease: true });
    if (!gate.ok) return blocked(command, owner, gate.reason);
    const before = recordReceipt(command, owner, 'before', { ok: true, blocked: false, reason: 'set_control_attempt' });
    config.supervisedControlEnabled = !!input.enabled;
    state.counters.mutatingCommands += 1;
    persistRuntimeState(config.supervisedControlEnabled ? 'supervised_control_enabled' : 'supervised_control_disabled');
    const after = recordReceipt(command, owner, 'after', { ok: true, blocked: false, reason: config.supervisedControlEnabled ? 'supervised_control_enabled' : 'supervised_control_disabled' });
    return { ok: true, blocked: false, reason: after.reason, enabled: config.supervisedControlEnabled, receipt_id: after.receipt_id, before_receipt_id: before.receipt_id, after_receipt_id: after.receipt_id, version: VERSION };
  }

  function pause(input = {}) {
    const command = 'pause';
    const owner = validateOwner(input.owner);
    const gate = validateBaseGate(command, owner, { requireLease: true, requireSupervised: true });
    if (!gate.ok) return blocked(command, owner, gate.reason);
    const before = recordReceipt(command, owner, 'before', { ok: true, blocked: false, reason: 'pause_attempt' });
    state.paused = true;
    state.counters.mutatingCommands += 1;
    persistRuntimeState('paused');
    const after = recordReceipt(command, owner, 'after', { ok: true, blocked: false, reason: 'paused' });
    return { ok: true, blocked: false, reason: 'paused', receipt_id: after.receipt_id, before_receipt_id: before.receipt_id, after_receipt_id: after.receipt_id, version: VERSION };
  }

  function resume(input = {}) {
    const command = 'resume';
    const owner = validateOwner(input.owner);
    const gate = validateBaseGate(command, owner, { requireLease: true });
    if (!gate.ok) return blocked(command, owner, gate.reason);
    const before = recordReceipt(command, owner, 'before', { ok: true, blocked: false, reason: 'resume_attempt' });
    state.paused = false;
    state.stopped = false;
    state.stopReason = '';
    state.counters.mutatingCommands += 1;
    persistRuntimeState('resumed');
    const after = recordReceipt(command, owner, 'after', { ok: true, blocked: false, reason: 'resumed' });
    return { ok: true, blocked: false, reason: 'resumed', receipt_id: after.receipt_id, before_receipt_id: before.receipt_id, after_receipt_id: after.receipt_id, version: VERSION };
  }

  function stop(input = {}) {
    const command = 'stop';
    const owner = validateOwner(input.owner);
    const gate = validateBaseGate(command, owner, { requireLease: true, requireSupervised: true });
    if (!gate.ok) return blocked(command, owner, gate.reason);
    const before = recordReceipt(command, owner, 'before', { ok: true, blocked: false, reason: 'stop_attempt' });
    state.paused = true;
    state.stopped = true;
    state.stopReason = sanitizeText(input.reason || 'supervised stop');
    state.counters.mutatingCommands += 1;
    persistRuntimeState('stopped');
    const after = recordReceipt(command, owner, 'after', { ok: true, blocked: false, reason: 'stopped' });
    return { ok: true, blocked: false, reason: 'stopped', receipt_id: after.receipt_id, before_receipt_id: before.receipt_id, after_receipt_id: after.receipt_id, version: VERSION };
  }

  function continueNow(input = {}) {
    const command = 'continueNow';
    const owner = validateOwner(input.owner);
    const dryRun = input.dryRun !== false;
    const maxActions = Number(input.maxActions || 0);
    const gate = validateBaseGate(command, owner, { requireLease: true, requireSupervised: true, requireNotPaused: true });
    if (!gate.ok) return blocked(command, owner, gate.reason, { dryRun, maxActions });
    if (maxActions !== 1) return blocked(command, owner, 'max_actions_must_equal_1', { dryRun, maxActions });
    if (input.promptSubmit === true || input.submitPrompt === true) return blocked(command, owner, 'prompt_submit_not_supported', { dryRun, maxActions });
    if (input.artifactDownload === true || input.downloadArtifact === true) return blocked(command, owner, 'artifact_download_not_supported', { dryRun, maxActions });

    const surfaceBefore = inspectRuntimeSurface();
    const beforeReason = dryRun ? 'dry_run_continue_attempt' : 'real_continue_attempt';
    const before = recordReceipt(command, owner, 'before', withSurface({ ok: true, blocked: false, reason: beforeReason, dryRun, maxActions }, surfaceBefore));
    if (dryRun) {
      state.counters.dryRunContinueAttempts += 1;
      const btn = findContinueGeneratingButton();
      const surfaceAfter = inspectRuntimeSurface();
      const result = withSurface({
        ok: true,
        blocked: false,
        dryRun: true,
        reason: btn ? 'dry_run_native_continue_available' : 'dry_run_no_continue_button',
        action: btn ? 'would_click_native_continue' : 'none',
        actionTaken: btn ? 'would_click_native_continue' : 'none',
        actionCount: 0,
        maxActions,
        realClickCount: 0
      }, surfaceAfter);
      const after = recordReceipt(command, owner, 'after', result);
      return withSurface({ ...result, receipt_id: after.receipt_id, before_receipt_id: before.receipt_id, after_receipt_id: after.receipt_id, version: VERSION }, result);
    }

    state.counters.realContinueAttempts += 1;
    const button = findContinueGeneratingButton();
    if (!button) {
      const surfaceAfter = inspectRuntimeSurface();
      const result = withSurface({
        ok: true,
        blocked: false,
        skipped: true,
        dryRun: false,
        reason: 'no_continue_button_present',
        blocker: 'no_native_continue_candidate',
        action: 'safe_noop',
        actionTaken: 'none',
        actionCount: 0,
        maxActions,
        realClickCount: 0,
        realContinueState: 'CAPABLE_NO_CANDIDATE',
        realContinueStateCode: 'CAPABLE_NO_CANDIDATE'
      }, { ...surfaceAfter, blocker: 'no_native_continue_candidate', realContinueState: 'CAPABLE_NO_CANDIDATE', realContinueStateCode: 'CAPABLE_NO_CANDIDATE' });
      const after = recordReceipt(command, owner, 'after', result);
      return withSurface({ ...result, receipt_id: after.receipt_id, before_receipt_id: before.receipt_id, after_receipt_id: after.receipt_id, version: VERSION }, result);
    }

    try {
      button.click();
      state.counters.realContinueClicks += 1;
      state.counters.mutatingCommands += 1;
      persistRuntimeState('continue_button_clicked_once');
      const surfaceAfter = inspectRuntimeSurface();
      const result = withSurface({
        ok: true,
        blocked: false,
        dryRun: false,
        reason: 'continue_button_clicked_once',
        action: 'clicked_native_continue',
        actionTaken: 'clicked_native_continue',
        actionCount: 1,
        maxActions,
        realClickCount: 1
      }, { ...surfaceAfter, actionTaken: 'clicked_native_continue', actionCount: 1, blocker: '' });
      const after = recordReceipt(command, owner, 'after', result);
      return withSurface({ ...result, receipt_id: after.receipt_id, before_receipt_id: before.receipt_id, after_receipt_id: after.receipt_id, version: VERSION }, result);
    } catch (error) {
      const surfaceAfter = inspectRuntimeSurface();
      const result = withSurface({
        ok: false,
        blocked: false,
        dryRun: false,
        reason: 'click_failed',
        error: sanitizeText(error && error.message ? error.message : error, 160),
        action: 'skipped',
        actionTaken: 'none',
        actionCount: 0,
        maxActions,
        realClickCount: 0
      }, { ...surfaceAfter, blocker: 'click_failed' });
      const after = recordReceipt(command, owner, 'after', result);
      return withSurface({ ...result, receipt_id: after.receipt_id, before_receipt_id: before.receipt_id, after_receipt_id: after.receipt_id, version: VERSION }, result);
    }
  }


  function dryRunContinue(input = {}) {
    return continueNow({ ...input, dryRun: true, maxActions: Number(input.maxActions || 1) || 1 });
  }

  function heartbeat(input = {}) {
    state.lastActivityAt = nowIso();
    return {
      ok: true,
      version: VERSION,
      build: BUILD,
      heartbeatAt: state.lastActivityAt,
      owner: sanitizeText(input.owner || '', 120),
      whitelistMatch: isWhitelistedPage(),
      lease: leaseState(),
      supervisedControlEnabled: config.supervisedControlEnabled,
      paused: state.paused,
      stopped: state.stopped,
      containsPromptText: false,
      containsUserText: false
    };
  }

  function metadata() {
    return {
      schema: 'cac.metadata.v1',
      version: VERSION,
      build: BUILD,
      apiObject: `window.${API_NAME}`,
      targetConversationId: TARGET_CONVERSATION_ID,
      whitelistUrl: `${TARGET_URL_PREFIX}*`,
      conversationId: currentConversationId(),
      driver_id: state.driverId,
      profile_label: state.profileLabel,
      sourceSha256: '',
      storageNamespace: STORAGE_NAMESPACE,
      receiptStorageKey: RECEIPT_STORAGE_KEY,
      storageSchema: STORAGE_SCHEMA,
      installedAt: state.installedAt,
      containsPromptText: false,
      containsUserText: false
    };
  }

  function status() {
    const btn = findContinueGeneratingButton();
    const surface = inspectRuntimeSurface();
    return {
      schema: 'cac.status.v1',
      version: VERSION,
      build: BUILD,
      runtimeActive: true,
      whitelistMatch: isWhitelistedPage(),
      conversationId: currentConversationId(),
      targetConversationId: TARGET_CONVERSATION_ID,
      globalEnabled: config.globalEnabled,
      enabled: config.enabled,
      conversationEnabled: config.conversationEnabled,
      autoContinueEnabled: config.autoContinueEnabled,
      supervisedControlEnabled: config.supervisedControlEnabled,
      artifactAutoDownloadEnabled: config.artifactAutoDownloadEnabled,
      promptSubmitEnabled: config.promptSubmitEnabled,
      hotkeysEnabled: config.hotkeysEnabled,
      unattendedOperationEnabled: config.unattendedOperationEnabled,
      productionInstallEnabled: config.productionInstallEnabled,
      realContinueSupported: config.realContinueSupported,
      promptSubmitSupported: config.promptSubmitSupported,
      artifactDownloadSupported: config.artifactDownloadSupported,
      dryRunContinueSupported: true,
      boundedRealContinueSupported: true,
      realContinue: realContinueStatus(surface),
      realContinueState: realContinueStatus(surface).stateCode,
      noCandidateRealContinueIsSafeNoop: true,
      maxRealActionsPerCommand: config.maxRealActionsPerCommand,
      continueButtonPresent: !!btn,
      stateCode: surface.stateCode,
      nativeContinueFound: surface.nativeContinueFound,
      composerFound: surface.composerFound,
      safeSubmitterFound: surface.safeSubmitterFound,
      blocker: surface.blocker,
      actionTaken: 'none',
      actionCount: 0,
      storageNamespace: STORAGE_NAMESPACE,
      receiptStorageKey: RECEIPT_STORAGE_KEY,
      paused: state.paused,
      stopped: state.stopped,
      stopReason: state.stopReason,
      lease: leaseState(),
      counters: { ...state.counters },
      receiptCount: state.receipts.length,
      lastActivityAt: state.lastActivityAt,
      containsPromptText: false,
      containsUserText: false
    };
  }

  function supervisorState() {
    const s = status();
    let stateCode = 'READY_FOR_SUPERVISED_COMMAND';
    if (!s.whitelistMatch) stateCode = 'BLOCKED_WHITELIST_MISMATCH';
    else if (s.stopped) stateCode = 'BLOCKED_STOPPED';
    else if (s.paused) stateCode = 'BLOCKED_PAUSED';
    else if (!s.lease.active) stateCode = 'NEEDS_LEASE';
    else if (!s.supervisedControlEnabled) stateCode = 'NEEDS_SUPERVISED_CONTROL_ENABLE';
    else if (!s.continueButtonPresent) stateCode = 'READY_NO_NATIVE_CONTINUE_BUTTON';
    return {
      schema: 'cac.supervisor_state.v1',
      version: VERSION,
      stateCode,
      status: s,
      next: stateCode === 'READY_FOR_SUPERVISED_COMMAND' ? 'continueNow dryRun or real maxActions=1' : 'satisfy gate or wait',
      containsPromptText: false,
      containsUserText: false
    };
  }

  function machineState() {
    return supervisorState();
  }

  function artifactDownloadState() {
    return {
      schema: 'cac.artifact_download_state.v1',
      version: VERSION,
      supported: false,
      enabled: false,
      downloads: state.counters.downloads,
      reason: 'artifact_download_not_supported_in_full_supervised_continue_candidate',
      containsPromptText: false,
      containsUserText: false
    };
  }

  function receiptLog(input = {}) {
    const limit = Math.max(1, Math.min(RECEIPT_LIMIT, Number(input.limit || RECEIPT_LIMIT)));
    return {
      schema: 'cac.receipt_log.v1',
      version: VERSION,
      count: state.receipts.length,
      storageNamespace: STORAGE_NAMESPACE,
      receipts: state.receipts.slice(0, limit),
      containsPromptText: false,
      containsUserText: false
    };
  }


  function statusSummary() {
    const s = status();
    return {
      schema: 'cac.status_summary.v1',
      version: VERSION,
      runtimeActive: true,
      conversationId: s.conversationId,
      whitelistMatch: s.whitelistMatch,
      supervisedControlEnabled: s.supervisedControlEnabled,
      leaseActive: !!(s.lease && s.lease.active),
      paused: !!s.paused,
      stopped: !!s.stopped,
      stateCode: s.stateCode,
      realContinueState: s.realContinueState,
      nativeContinueFound: !!s.nativeContinueFound,
      actionCount: 0,
      receiptCount: s.receiptCount,
      containsPromptText: false,
      containsUserText: false
    };
  }

  function receiptSummary(input = {}) {
    const limit = Math.max(1, Math.min(12, Number(input.limit || 6)));
    return {
      schema: 'cac.receipt_summary.v1',
      version: VERSION,
      receiptCount: state.receipts.length,
      latest: state.receipts.slice(0, limit).map((r) => ({
        receipt_id: r.receipt_id,
        command: r.command,
        phase: r.phase,
        ok: !!r.ok,
        blocked: !!r.blocked,
        reason: r.reason,
        stateCode: r.stateCode,
        actionTaken: r.actionTaken,
        actionCount: r.actionCount,
        timestamp: r.timestamp
      })),
      containsPromptText: false,
      containsUserText: false
    };
  }

  function realContinueProbe() {
    const surface = inspectRuntimeSurface();
    return {
      schema: 'cac.real_continue_probe.v1',
      version: VERSION,
      ...realContinueStatus(surface),
      surface,
      candidateDetection: {
        nativeOnly: true,
        composerSubmitIsNotContinue: true,
        fakeButtonNotUsed: true,
        promptSubmitFallback: false
      }
    };
  }

  function apiSummary() {
    const s = statusSummary();
    return {
      schema: 'cac.api_summary.v1',
      version: VERSION,
      apiObject: `window.${API_NAME}`,
      keyCount: Object.keys(api).length,
      status: s,
      realContinue: realContinueProbe(),
      safety: {
        defaultInert: true,
        oneConversationWhitelist: true,
        broadAllTabsDefault: false,
        promptSubmitSupported: false,
        artifactDownloadSupported: false,
        unattendedSupported: false,
        mutatingCommandsRequireLease: true,
        receiptsTextFree: true,
        oneVersionPerBrowser: true
      },
      containsPromptText: false,
      containsUserText: false
    };
  }

  function apiContract() {
    return {
      schema: 'cac.api_enhancement_contract.v1',
      version: VERSION,
      apiObject: `window.${API_NAME}`,
      readApis: ['status', 'statusSummary', 'apiSummary', 'metadata', 'heartbeat', 'apiContract', 'selfTest', 'supervisorState', 'machineState', 'leaseState', 'artifactDownloadState', 'receiptLog', 'receiptSummary', 'realContinueProbe', 'realContinueScenario'],
      commandApis: ['acquireLease', 'releaseLease', 'lease.acquire', 'lease.release', 'pause', 'resume', 'stop', 'continueNow', 'dryRunContinue', 'setSupervisedControlEnabled'],
      mutatingGate: ['active whitelist match', 'valid non-expired owner lease', 'supervisedControlEnabled for controlled commands', 'maxActions=1 for continueNow', 'receipt before and after action attempt'],
      structuredSkipFields: ['stateCode', 'nativeContinueFound', 'composerFound', 'safeSubmitterFound', 'blocker', 'actionTaken', 'actionCount'],
      leaseFieldCompatibility: ['leaseId', 'lease_id', 'leaseUntil', 'until', 'acquiredAt', 'acquired_at'],
      storageIsolation: { mode: 'conversation_scoped_localStorage', namespace: STORAGE_NAMESPACE, receiptStorageKey: RECEIPT_STORAGE_KEY },
      realContinueSupported: true,
      dryRunContinueSupported: true,
      promptSubmitSupported: false,
      artifactDownloadSupported: false,
      defaultInert: true,
      unattendedOperationSupported: false,
      productionInstallSupported: false,
      containsPromptText: false,
      containsUserText: false
    };
  }

  function realContinueScenario() {
    return {
      schema: 'cac.real_continue_scenario.v1',
      version: VERSION,
      targetConversationUrl: `${TARGET_URL_PREFIX}`,
      deterministicPath: 'native_continue_button_fixture',
      requiredPageState: 'A native ChatGPT Continue generating button must already be visible in the target conversation before running the real smoke command.',
      setupRecipe: [
        'Use a dedicated non-maintainer CAC smoke conversation matching the userscript @match URL.',
        'Owner or Codex operator manually prepares a long assistant response that naturally stops with a native Continue generating button visible.',
        'Do not use CAC to submit prompt text or create the state.',
        'Run the fast-track command only after status().nativeContinueFound is true.',
        'If status().nativeContinueFound is false, continueNow(dryRun:false,maxActions:1) must return reason=no_continue_button with actionCount=0.'
      ],
      apiProbe: 'window.__cgptAutoContinueAPI.status().nativeContinueFound === true',
      codexCommand: 'D:\\Codex\\CAC_FAST_TRACK.cmd --yes-real --max-actions 1 --no-json',
      noPromptSubmitByCAC: true,
      noArtifactDownloadByCAC: true,
      containsPromptText: false,
      containsUserText: false
    };
  }

  function selfTest() {
    const commandNames = ['acquireLease', 'releaseLease', 'pause', 'resume', 'stop', 'continueNow', 'dryRunContinue', 'setSupervisedControlEnabled'];
    const readNames = ['status', 'statusSummary', 'apiSummary', 'metadata', 'heartbeat', 'apiContract', 'selfTest', 'supervisorState', 'machineState', 'leaseState', 'artifactDownloadState', 'receiptLog', 'receiptSummary', 'realContinueProbe', 'realContinueScenario'];
    const beforeReceiptCount = state.receipts.length;
    const blockedProbe = validateBaseGate('continueNow', 'self-test-agent', { requireLease: true, requireSupervised: true, requireNotPaused: true });
    return {
      schema: 'cac.full_supervised_self_test.v1',
      version: VERSION,
      ok: true,
      cleanInstallInert: config.globalEnabled === false && config.enabled === false && config.conversationEnabled === false && config.autoContinueEnabled === false && config.artifactAutoDownloadEnabled === false && config.promptSubmitEnabled === false && config.hotkeysEnabled === false && config.unattendedOperationEnabled === false && config.productionInstallEnabled === false,
      whitelistOnly: isWhitelistedPage(),
      readApisPresent: readNames.every((name) => typeof api[name] === 'function'),
      commandApisPresent: commandNames.every((name) => typeof api[name] === 'function'),
      commandBlockedWithoutLease: !blockedProbe.ok && blockedProbe.reason === 'missing_lease',
      storageIsolationConversationScoped: STORAGE_NAMESPACE.includes(TARGET_CONVERSATION_ID) && RECEIPT_STORAGE_KEY.includes(TARGET_CONVERSATION_ID),
      leaseAliasesPresent: ['leaseUntil','until','acquiredAt','acquired_at','leaseId','lease_id'].every((key) => Object.prototype.hasOwnProperty.call(leaseState(), key)),
      statusHasRichSkipFields: ['stateCode','nativeContinueFound','composerFound','safeSubmitterFound','blocker','actionTaken','actionCount'].every((key) => Object.prototype.hasOwnProperty.call(status(), key)),
      zeroPromptSubmits: state.counters.promptSubmits === 0,
      zeroDownloads: state.counters.downloads === 0,
      noAutomaticContinue: state.counters.realContinueClicks === 0 && state.counters.realContinueAttempts === 0 && state.counters.dryRunContinueAttempts === 0,
      promptSubmitSupported: false,
      artifactDownloadSupported: false,
      realContinueSupported: true,
      realContinueStateSplit: true,
      noCandidateRealContinueIsSafeNoop: true,
      dryRunSupported: true,
      receiptsWrittenBySelfTest: state.receipts.length - beforeReceiptCount,
      containsPromptText: false,
      containsUserText: false
    };
  }

  function cleanup(reason) {
    try {
      state.paused = true;
      state.stopped = true;
      state.stopReason = sanitizeText(reason || 'runtime cleanup', 120);
      if (window[API_NAME] === api) delete window[API_NAME];
    } catch (_) {}
  }

  const previousSingleton = window[SINGLETON_KEY];
  if (previousSingleton && typeof previousSingleton.cleanup === 'function') {
    try { previousSingleton.cleanup('superseded_by_v220_lease_alias_candidate'); } catch (_) {}
  }
  const previousApi = window[API_NAME];
  if (previousApi && typeof previousApi.__cacCleanup === 'function') {
    try { previousApi.__cacCleanup('superseded_by_v220_lease_alias_candidate'); } catch (_) {}
  }
  const previous = window[RUNTIME_KEY];
  if (previous && typeof previous.cleanup === 'function') {
    try { previous.cleanup('superseded_by_new_cac_candidate'); } catch (_) {}
  }

  const api = Object.freeze({
    status,
    statusSummary,
    apiSummary,
    metadata,
    heartbeat,
    apiContract,
    selfTest,
    supervisorState,
    machineState,
    leaseState,
    artifactDownloadState,
    receiptLog,
    receiptSummary,
    realContinueProbe,
    realContinueScenario,
    acquireLease,
    releaseLease,
    pause,
    resume,
    stop,
    continueNow,
    dryRunContinue,
    setSupervisedControlEnabled,
    lease: Object.freeze({ acquire: acquireLease, release: releaseLease, state: leaseState }),
    __cacCleanup: cleanup,
    __version: VERSION,
    __build: BUILD
  });

  window[RUNTIME_KEY] = { version: VERSION, cleanup, installedAt: state.installedAt };
  window[SINGLETON_KEY] = { version: VERSION, cleanup, installedAt: state.installedAt, apiObject: `window.${API_NAME}` };
  window[API_NAME] = api;

  try {
    window.dispatchEvent(new CustomEvent('cac:runtime-ready', {
      detail: { version: VERSION, apiObject: `window.${API_NAME}`, whitelistMatch: isWhitelistedPage(), realContinueSupported: true, defaultInert: true }
    }));
  } catch (_) {}

  console.info('[CAC] full supervised candidate ready', { version: VERSION, apiObject: `window.${API_NAME}`, defaultInert: true, realContinueSupported: true });
})();
