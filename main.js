//------------------------statics--------------------------

    const experienceFilters = {
      id: "experience",
      name: "Опыт работы",
      type: "select",
      values: [
        { id: "noExperience", name: "Нет опыта" },
        { id: "between1And3", name: "От1 года до 3 лет" },
        { id: "between3And6", name: "от 3 до 6 лет" },
        { id: "moreThan6", name: "Более 6 лет" },
      ],
    };

    const employmentFIlters = {
      id: "employment",
      name: "Тип занятости",
      type: "select",
      values: [
        { id: "full", name: "Полная занятость" },
        { id: "part", name: "Частичная занятость" },
        { id: "project", name: "Проектная работа" },
        { id: "volunteer", name: "Волонтёрство" },
        { id: "probation", name: "Стажировка" },
      ],
    };

    const scheduleFilters = {
      id: "schedule",
      name: "График работы",
      type: "select",
      values: [
        { id: "fullDay", name: "Полный день" },
        { id: "shift", name: "Сменный график" },
        { id: "flexible", name: "Гибкий график" },
        { id: "remote", name: "Удалённая работа" },
        { id: "flyInFlyOut", name: "Вахтовый метод" },
      ],
    };

    const labelFilters = {
      id: "label",
      name: "Метки",
      type: "select",
      values: [
        { id: "with_address", name: "С адресом" },
        { id: "accept_handicapped", name: "Доступные с инвалидностью" },
        { id: "not_from_agency", name: "Без агенств" },
        { id: "accept_kids", name: "Доступные с 14 лет" },
        { id: "accredited_it", name: "Аккредитованные компании" },
        { id: "low_performance", name: "меньше 10 откликов" },
        { id: "internship", name: "Стажировки" },
      ],
    };

    const salaryFilter = {
      id: "salary",
      name: "Зарплата",
      type: "from",
    };

    const filters = [
      experienceFilters,
      employmentFIlters,
      scheduleFilters,
      labelFilters,
      salaryFilter,
    ];

    //---------------------------------------------------------

    //--------state--------

    state = {
      vacancies: {
        isError: false,
        isLoading: false,
        items: [],
        pageAmount: 0,
        fetchquery: {
          page: 0,
          params: [
            { id: "experience", type: "array", values: [] },
            { id: "employment", type: "array", values: [] },
            { id: "schedule", type: "array", values: [] },
            { id: "label", type: "array", values: [] },
            { id: "salary", type: "value", value: null },
          ],
          searchField: '',
        },
      },
    };

    //---------------------

    //------------helpers-----------------

    const debounce = (callback, timeout) => {
      return function perform(...args) {
        let previousCall = this.lastCall
        this.lastCall = Date.now()
        if (previousCall && this.lastCall - previousCall <= timeout) {
          clearTimeout(this.lastCallTimer)          
        }
        this.lastCallTimer = setTimeout(() => callback(...args), timeout)
      }
    }

    //------------------------------------

    //------------------------------------------api--------------------------------------

    const fetchFirstVacancies = async () => {
      const container = document.getElementById("vacancies-container");
      const prevVacancies = container.childNodes;
      if (prevVacancies) {
        prevVacancies.forEach((item) => {
          item.style.opacity = 0;
        });
      }
      setTimeout(async () => {
        try {
          state.vacancies.fetchquery.page = 0;
          state.vacancies.isLoading = true;
          state.vacancies.isError = false;
          query = state.vacancies.fetchquery;
          queryParams = "";
          query.params.forEach((param) => {
            if (param.type == "array") {
              param.values.forEach((value) => {
                queryParams += `&${param.id}=${value}`;
              });
            }
            if (param.type == "value" && param.value) {
              queryParams += `&${param.id}=${param.value}`;
            }
          });
          if (query.params[4].value) {
            queryParams += `&only_with_salary=true`;
          }
          queryParams += `&text=${query.searchField}`
          renderFirstVacancies();
          const res = await fetch(
            `https://api.hh.ru/vacancies?page=${query.page}&per_page=10&area=1530${queryParams}`
          );
          if (!res.ok) {
            state.vacancies.isError = true;
            renderFirstVacancies();
          } else {
            const body = await res.json();
            if (body.items) {
              state.vacancies.items = body.items;
              state.vacancies.pageAmount = body.pages;
            }
          }
        } catch (e) {
          state.vacancies.isError = true;
          renderFirstVacancies();
        } finally {
          state.vacancies.isLoading = false;
          renderFirstVacancies();
        }
      }, 400);
    };

    const debouncedFetchFirstVacancies = debounce(fetchFirstVacancies, 500)

    const fetchVacancies = async () => {
      const button = document.getElementById("more-button");
      try {
        button.disabled = true;
        state.vacancies.isLoading = true;
        state.vacancies.isError = false;
        query = state.vacancies.fetchquery;
        queryParams = "";
        query.params.forEach((param) => {
          if (param.type == "array") {
            param.values.forEach((value) => {
              queryParams += `&${param.id}=${value}`;
            });
          }
          if (param.type == "value" && param.value) {
            queryParams += `&${param.id}=${param.value}`;
          }
        });
        queryParams += `&text=${query.searchField}`
        renderVacancies();
        const res = await fetch(
          `https://api.hh.ru/vacancies?page=${
            query.page + 1
          }&per_page=10&area=1530` + queryParams
        );
        if (!res.ok) {
          state.vacancies.isError = true;
          renderVacancies();
        } else {
          const body = await res.json();
          if (body.items) {
            state.vacancies.items.push(...body.items);
            state.vacancies.pageAmount = body.pages;
            state.vacancies.fetchquery.page += 1;
          }
        }
      } catch (e) {
        state.vacancies.isError = true;
        console.log(e);
        renderVacancies();
      } finally {
        state.vacancies.isLoading = false;
        renderVacancies();
        console.log(state.vacancies.pageAmount);
        button.disabled = false;
      }
    };

    //-----------------------------------------------------------------------------------

    // -----------------vacancy building-------------------------

    const onVacancyClick = (url) => {
      //open hh.ru on new page
      newWindow = window.open(url);
      if (!newWindow.closed && newWindow) newWindow.focus();
    };

    const parseTags = (item, vacancyTags) => {
      let tags_arr = [];
      if (item.experience) {
        tags_arr.push(item.experience.name);
      }
      if (
        Object.values(item.work_format).find((format) => format.id === "REMOTE")
      ) {
        tags_arr.push("Можно удалённо");
      }
      if (item.working_hours.length > 0) {
        if (item.working_hours[0].name !== "Другое") {
          tags_arr.push(item.working_hours[0].name);
        }
      }
      if (item.work_schedule_by_days.length > 0) {
        if (item.work_schedule_by_days[0].name !== "Другое") {
          tags_arr.push(item.work_schedule_by_days[0].name);
        }
      }
      tags_arr.forEach((tagText) => {
        const tag = document.createElement("div");
        tag.className = "tag";
        tag.innerText = tagText;
        vacancyTags.appendChild(tag);
      });
    };

    const attachVacancyName = (name, vacancy) => {
      const vacancyName = document.createElement("h2");
      vacancyName.className = "name";
      vacancyName.textContent = name;
      vacancy.appendChild(vacancyName);
    };

    const attachVacancySalary = (salary_range, vacancy) => {
      if (salary_range) {
        const vacancySalary = document.createElement("div");
        vacancySalary.className = "salary";
        const label = document.createElement("span");
        label.className = "salary-label";
        label.innerText = "Зарплата:";
        const value = document.createElement("span");
        value.className = "salary-value";
        let innerText = "";
        if (salary_range.from) {
          innerText += `от ${salary_range.from} `;
        }
        if (salary_range.to) {
          innerText += `до ${salary_range.to} `;
        }
        innerText += " " + salary_range.mode.name.toLowerCase();
        value.innerText = innerText;
        vacancySalary.append(label, value);
        vacancy.appendChild(vacancySalary);
      }
    };

    const attachVacancyFooter = (item, vacancy) => {
      const vacancyFooter = document.createElement("div");
      vacancyFooter.className = "vacancy-footer";
      const vacancyTags = document.createElement("div");
      vacancyTags.className = "tags";
      parseTags(item, vacancyTags);
      const linkButton = document.createElement("button");
      linkButton.className = "vacancy-link-button";
      linkButton.innerHTML =
        '<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024"><path fill="currentColor" d="M340.864 149.312a30.59 30.59 0 0 0 0 42.752L652.736 512L340.864 831.872a30.59 30.59 0 0 0 0 42.752a29.12 29.12 0 0 0 41.728 0L714.24 534.336a32 32 0 0 0 0-44.672L382.592 149.376a29.12 29.12 0 0 0-41.728 0z"/></svg>';
      linkButton.addEventListener("click", () =>
        onVacancyClick(item.alternate_url)
      );
      vacancyFooter.append(vacancyTags, linkButton);
      vacancy.append(vacancyFooter);
    };

    const attachVacancyCompany = (employer, vacancy) => {
      const wrapper = document.createElement("div");
      wrapper.className = "company";
      const label = document.createElement("span");
      label.className = "company-label";
      label.innerText = "Компания:";
      const name = document.createElement("span");
      name.className = "company-name";
      name.innerText = employer.name;
      wrapper.append(label, name);
      vacancy.appendChild(wrapper);
    };

    const attachVacancyArea = (area, vacancy) => {
      const vacancyArea = document.createElement("p");
      vacancyArea.className = "area";
      vacancyArea.innerText = area.name;
      vacancy.appendChild(vacancyArea);
    };

    const buildVacancy = (vacancy) => {
      const vacancyComponent = document.createElement("div");
      vacancyComponent.className = "vacancy";
      attachVacancyArea(vacancy.area, vacancyComponent);
      attachVacancyName(vacancy.name, vacancyComponent);
      attachVacancySalary(vacancy.salary_range, vacancyComponent);
      attachVacancyCompany(vacancy.employer, vacancyComponent);
      attachVacancyFooter(vacancy, vacancyComponent);
      vacancyComponent.addEventListener("animationend", (e) => {
        e.target.style.opacity = 1;
        e.target.style.animation = "none";
      });
      return vacancyComponent;
    };

    const attachMoreButton = (container) => {
      const Button = document.createElement("button");
      Button.className = "full-width-button";
      Button.id = "more-button";
      Button.addEventListener("click", () => fetchVacancies());
      const title = document.createElement("span");
      title.className = "more-button-title";
      title.id = "more-button-message";
      title.innerText = "Показать ещё";
      const icon = document.createElement("span");
      icon.className = "button-icon";
      icon.innerText = "+";
      Button.append(title, icon);
      container.appendChild(Button);
    };

    //-----------------------------------------------------------

    //---------------------filters--------------------------

    const buildCheckbox = (option, id) => {
      const checkbox = document.createElement("label");
      checkbox.className = "checkbox";
      checkbox.htmlFor = `${id}-${option.id}`
      const input = document.createElement("input");
      input.type = "checkbox";
      input.className = "checkbox-input";
      input.id = `${id}-${option.id}`;
      const trigger = document.createElement("div");
      trigger.className = "checkbox-trigger";
      trigger.innerHTML =
        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m4 12l6 6L20 6"/></svg>';
      checkbox.append(input, trigger);
      return checkbox;
    };

    const buildCheckboxOption = (option, filterName, id) => {
      const filterOption = document.createElement("label");
      filterOption.htmlFor = `${id}-${option.id}`;
      filterOption.className = "filter-option";
      filterOption.addEventListener("mouseup", (e) => {
        const checkbox = document.getElementById(option.id)
        console.log(checkbox)
        setFilter(filterName, option.id)
      }
      );
      const checkBox = buildCheckbox(option, id);
      const title = document.createElement("p");
      title.className = "filter-option-title";
      title.innerText = option.name;
      filterOption.append(checkBox, title);
      return filterOption;
    };

    const buildFromInput = (filter) => {
      const input = document.createElement("input");
      input.className = "fromInput";
      input.placeholder = "от";
      input.addEventListener("input", (e) => {
        onFromInput(filter.id, e);
      });
      return input;
    };

    const buildFilterBlock = (filter, id) => {
      const filterBlock = document.createElement('div')
      filterBlock.className = 'filter-block'
      const filterHeader = document.createElement('div')
      filterHeader.className = 'filter-head'
      filterHeader.addEventListener('mouseup', (e) => openFilter(e))
      const filterName = document.createElement('p')
      filterName.className='filter-name'
      filterName.innerText = filter.name;
      const filterOpenButton = document.createElement("button");
      filterOpenButton.className = "filter-open-button";
      filterOpenButton.innerHTML =
        '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 1024 1024"><path fill="currentColor" d="M831.872 340.864L512 652.672L192.128 340.864a30.59 30.59 0 0 0-42.752 0a29.12 29.12 0 0 0 0 41.6L489.664 714.24a32 32 0 0 0 44.672 0l340.288-331.712a29.12 29.12 0 0 0 0-41.728a30.59 30.59 0 0 0-42.752 0z"/></svg>';
      filterHeader.append(filterName, filterOpenButton);
      filterBlock.appendChild(filterHeader);
      const filterOptions = document.createElement("div");
      filterOptions.className = "filter-options";
      if (filter.type === "select") {
        filterOptions.style.setProperty(
          "--opened-height",
          `${40 * filter.values.length + 16}px`
        );
        filterOptions.append(
          ...filter.values.map((option) =>
            buildCheckboxOption(option, filter.id, id)
          )
        );
      } else if (filter.type === "from") {
        filterOptions.style.setProperty("--opened-height", "88px");
        filterOptions.appendChild(buildFromInput(filter));
      }
      filterBlock.appendChild(filterOptions);
      return filterBlock;
    };

    const attachResetButton = (container) => {
      const button = document.createElement("button");
      button.className = "reset_button";
      button.innerText = "Сбросить фильтры";
      button.addEventListener("mouseup", () => resetFilters());
      container.appendChild(button);
    };

    const openFilter = (e) => {
      const filter = e.target.closest(".filter-block");
      if (filter.className === "filter-block") {
        filter.className = "filter-block opened";
      } else {
        filter.className = "filter-block";
      }
    };

    const setFilter = (id, value) => {
      const params = state.vacancies.fetchquery.params;
      const param = params.find((item) => item.id === id);
      if (param.type === "array") {
        if (param.values.includes(value)) {
          param.values = param.values.filter((Value) => Value != value);
        } else {
          param.values.push(value);
        }
      } else if (param.type === "value") {
        param.value = value;
      }
      debouncedFetchFirstVacancies();
    };

    const resetFilters = () => {
      const filters = state.vacancies.fetchquery.params;
      filters.forEach((param) => {
        if (param.type == "array") {
          param.values = [];
        } else if (param.type == "value") {
          param.value = null;
        }
      });
      const filterComponents = document.querySelectorAll("input");
      filterComponents.forEach((item) => {
        if (item.className == "checkbox-input") {
          item.checked = false;
        } else {
          item.value = "";
        }
      });
      debouncedFetchFirstVacancies();
    };

    const onFromInput = (filterName, e) => {
      if (
        isNaN(parseInt(e.target.value[e.target.value.length - 1])) ||
        e.target.value.length > 10
      ) {
        if (e.target.value == "") {
          state.vacancies.fetchquery.params[4].value = null;
          debouncedFetchFirstVacancies();
        } else {
          e.target.value = e.target.value.slice(0, e.target.value.length - 1);
        }
      } else {
        setFilter(filterName, e.target.value);
      }
    };

    const onSearchInput = (e) => {
      const {value} = e.target
      state.vacancies.fetchquery.searchField = value;
      debouncedFetchFirstVacancies();
    }

    const debouncedOnSearchInput = debounce(onSearchInput, 400)
    
    const openModal = () => {
      resetFilters();
      renderFilters("modal-filters");
      const button = document.getElementById("filters-button");
      button.disabled = true;
    };
    const closeModal = () => {
      const modal = document.getElementById("modal-filters");
      modal.style.opacity = 0;
      modal.style.transform = "translateY(2rem)";
      setTimeout(() => {
        modal.innerHTML =
          '<div class="modal-filter-header"><span>Фильтр</span><button onclick="closeModal()" class="modal-filter-close-button"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="2" d="M20 20L4 4m16 0L4 20"/></svg></button></div>';
        modal.style.opacity = 1;
        modal.style.transform = "translateY(0)";
        const button = document.getElementById("filters-button");
        button.disabled = false;
      }, 350);
    };

    //-----------------------------------------------------

    //----------------------renders------------------------

    const renderFirstVacancies = () => {
      const container = document.getElementById("vacancies-container");
      container.innerHTML = "";
      if (state.vacancies.isError) {
        container.innerHTML =
          "<div class='info_message'>something went wrong</div>";
      } else if (state.vacancies.isLoading) {
        container.innerHTML = "<div class='info_message'></div>";
      } else {
        const vacancies = state.vacancies.items;
        vacancies.forEach((item, id) => {
          const vacancy = buildVacancy(item);
          vacancy.style.setProperty("--delay", `${0.25 * id}s`);
          container.appendChild(vacancy);
        });
      }
      attachMoreButton(container);
    };

    const renderVacancies = () => {
      const moreButton = document.getElementById("more-button");
      const buttonMessage = document.getElementById("more-button-message");
      if (state.vacancies.isError) {
        buttonMessage.innerText = "Ошибка загрузки, попробуйте снова";
      } else if (state.vacancies.isLoading) {
        buttonMessage.innerText = "Загрузка...";
      } else if (
        state.vacancies.fetchquery.page >=
        state.vacancies.pageAmount - 1
      ) {
        buttonMessage.innerText = "Вакансий больше нет";
        moreButton.removeEventListener("click");
      } else {
        buttonMessage.innerText = "Показать ещё";
        const vacancies = state.vacancies.items.slice(
          state.vacancies.fetchquery.page * 10
        );
        vacancies.forEach((item, id) => {
          const vacancy = buildVacancy(item);
          vacancy.style.setProperty("--delay", `${0.1 * id}s`);
          moreButton.before(vacancy);
        });
      }
    };

    const renderFilters = (id) => {
      const filterContainer = document.getElementById(id);
      filterContainer.append(...filters.map((item) => buildFilterBlock(item, id)));
      attachResetButton(filterContainer);
    };

    //-------------------------------------------------------

    //---------initialization-----------

    const init = () => {
      fetchFirstVacancies();
      renderFilters("filters-container");
    };

    window.onload = init;

    //----------------------------------