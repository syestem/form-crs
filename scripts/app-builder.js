async function initializeBuilderPage() {
  try {
    await runWithLoading("Готовим конструктор...", async () => {
      ensureBuilderSaveIndicator();
      updateBuilderSaveIndicator();
      ui.addTopFieldBtn?.remove();
      applyBuilderAuthMode();

      if (hasSupabaseAuthConfig()) {
        setAdminToken("");
        const client = getSupabaseBrowserClient();
        const result = await client.auth.getSession().catch(() => ({ data: { session: null } }));
        if (result?.data?.session) {
          setSupabaseSession(result.data.session);
        }
      }

      renderBuilder();
      if (hasBuilderAuthorization()) {
        setSelectedBuilderFormSlug("");
        await loadBuilderForms();
        unlockBuilderWorkspace();
      }
    });
  } finally {
    resetLoadingOverlay();
  }

  if (ui.unlockBuilderBtn) {
    ui.unlockBuilderBtn.addEventListener("click", handleBuilderUnlock);
  }

  if (ui.builderPasscode) {
    ui.builderPasscode.addEventListener("keydown", event => {
      if (event.key === "Enter") {
        handleBuilderUnlock();
      }
    });
  }

  if (ui.builderEmail) {
    ui.builderEmail.addEventListener("keydown", event => {
      if (event.key === "Enter") {
        handleBuilderUnlock();
      }
    });
  }

  ui.builderForgotPasswordBtn?.addEventListener("click", handleForgotPassword);
  ui.builderFormsBtn?.addEventListener("click", async () => {
    closeActiveBuilderForm();
    state.builder.forms.loading = true;
    renderBuilder();
    await loadBuilderForms();
  });

  ui.closeBuilderBtn.addEventListener("click", closeBuilder);
  ui.saveSchemaBtn?.addEventListener("click", saveSchemaNow);
  ui.saveSchemaSidebarBtn?.addEventListener("click", saveSchemaNow);
  ui.builderTabs.forEach(tab => {
    tab.addEventListener("click", async () => {
      await setBuilderTab(tab.dataset.builderTab || "constructor");
    });
  });
  ui.addTopFieldBtn?.addEventListener("click", () => {
    insertFieldAt(state.schema.length);
  });
  ui.addFieldFromSidebarBtn?.addEventListener("click", () => {
    insertFieldAt(state.schema.length);
  });
  ui.resetSchemaBtn.addEventListener("click", () => openConfirmModal("reset-schema"));
  if (ui.resetAllDataBtn) {
    ui.resetAllDataBtn.addEventListener("click", () => openConfirmModal("reset-all-data"));
  }
  ui.confirmCancelBtn.addEventListener("click", closeConfirmModal);
  ui.confirmSubmitBtn.addEventListener("click", confirmModalAction);
  ui.confirmModal.addEventListener("click", event => {
    if (event.target === ui.confirmModal) {
      closeConfirmModal();
    }
  });
}
