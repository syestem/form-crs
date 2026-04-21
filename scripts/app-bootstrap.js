function cacheUiNodes() {
  ui.dynamic = document.getElementById("dynamic");
  ui.resultCard = document.querySelector(".result");
  ui.perPerson = document.getElementById("perPerson");
  ui.participantsCount = document.getElementById("participantsCount");
  ui.responsesCount = document.getElementById("responsesCount");
  ui.statsGrid = document.getElementById("statsGrid");
  ui.participantsStatCard = document.getElementById("participantsStatCard");
  ui.responsesStatCard = document.getElementById("responsesStatCard");
  ui.detailsBtn = document.getElementById("detailsBtn");
  ui.saveBtn = document.getElementById("saveBtn");
  ui.clearSelectionBtn = document.getElementById("clearSelectionBtn");
  ui.submitStatus = document.getElementById("submitStatus");
  ui.detailsModal = document.getElementById("detailsModal");
  ui.detailsContent = document.getElementById("detailsContent");
  ui.closeModal = document.getElementById("closeModal");
  ui.confirmModal = document.getElementById("confirmModal");
  ui.confirmTitle = document.getElementById("confirmTitle");
  ui.confirmText = document.getElementById("confirmText");
  ui.confirmCancelBtn = document.getElementById("confirmCancelBtn");
  ui.confirmSubmitBtn = document.getElementById("confirmSubmitBtn");
  ui.builderContent = document.getElementById("builderContent");
  ui.builderActions = document.getElementById("builderActions");
  ui.builderSidebar = document.getElementById("builderSidebar");
  ui.builderLayout = document.querySelector(".builder-layout");
  ui.closeBuilderBtn = document.getElementById("closeBuilderBtn");
  ui.builderFormsBtn = document.getElementById("builderFormsBtn");
  ui.builderOpenFormBtn = document.getElementById("builderOpenFormBtn");
  ui.saveSchemaBtn = document.getElementById("saveSchemaBtn");
  ui.saveSchemaSidebarBtn = document.getElementById("saveSchemaSidebarBtn");
  ui.addFieldFromSidebarBtn = document.getElementById("addFieldFromSidebarBtn");
  ui.addTopFieldBtn = document.getElementById("addTopFieldBtn");
  ui.resetSchemaBtn = document.getElementById("resetSchemaBtn");
  ui.resetAllDataBtn = document.getElementById("resetAllDataBtn");
  ui.builderGate = document.getElementById("builderGate");
  ui.builderWorkspace = document.getElementById("builderWorkspace");
  ui.builderEmail = document.getElementById("builderEmail");
  ui.builderPasscode = document.getElementById("builderPasscode");
  ui.unlockBuilderBtn = document.getElementById("unlockBuilderBtn");
  ui.builderForgotPasswordBtn = document.getElementById("builderForgotPasswordBtn");
  ui.builderAuthModeLabel = document.getElementById("builderAuthModeLabel");
  ui.builderAuthError = document.getElementById("builderAuthError");
  ui.builderWorkspaceTitle = document.getElementById("builderWorkspaceTitle");
  ui.builderTabs = Array.from(document.querySelectorAll("[data-builder-tab]"));
  ui.builderOutline = document.getElementById("builderOutline");
  ui.pageTitle = document.getElementById("pageTitle");
  ui.heroRibbonTop = document.getElementById("heroRibbonTop");
  ui.heroKicker = document.getElementById("heroKicker");
  ui.heroHeadline = document.getElementById("heroHeadline");
  ui.heroSubline = document.getElementById("heroSubline");
  ui.heroBadge = document.getElementById("heroBadge");
  ui.heroNote = document.getElementById("heroNote");
  ui.heroRibbonBottom = document.getElementById("heroRibbonBottom");
  ui.adminEntryLink = document.getElementById("adminEntryLink");
  ui.userSectionTitle = document.getElementById("userSectionTitle");
  ui.userSectionHint = document.getElementById("userSectionHint");
  ui.participantsStatLabel = document.getElementById("participantsStatLabel");
  ui.responsesStatLabel = document.getElementById("responsesStatLabel");
  ui.name = document.getElementById("name");
  ui.group = document.getElementById("group");
  ui.hoursFieldWrap = document.getElementById("hoursFieldWrap");
  ui.hours = document.getElementById("hours");
  ui.profileError = document.getElementById("profileError");
  ui.profileCard = document.getElementById("profileCard");
  ui.scrollTopBtn = document.getElementById("scrollTopBtn");
}

async function initializeCommonData() {
  hydrateSchema();
  if (!isBuilderPage()) {
    await loadRemoteSchema().catch(error => console.error(error));
  }
  initializeDefaults(getFields());
}

document.addEventListener("DOMContentLoaded", async () => {
  window.addEventListener("pointerup", () => {
    if (!state.builder.drag) {
      state.builder.dragArmed = null;
    }
  });

  ui.pageMode = document.body.dataset.page || "form";
  cacheUiNodes();

  document.addEventListener("focusin", updateMobileInputMode);
  document.addEventListener("focusout", () => {
    window.setTimeout(updateMobileInputMode, 0);
  });
  updateMobileInputMode();

  try {
    await initializeCommonData();

    if (isBuilderPage()) {
      if (typeof initializeBuilderPage !== "function") {
        throw new Error("initializeBuilderPage is not defined");
      }
      await initializeBuilderPage();
      return;
    }

    if (typeof initializeFormPage !== "function") {
      throw new Error("initializeFormPage is not defined");
    }
    await initializeFormPage();
  } finally {
    document.body.classList.remove("app-booting");
  }
});
