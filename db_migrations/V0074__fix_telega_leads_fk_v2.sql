-- Переименовываем старый constraint чтобы добавить новый
ALTER TABLE t_p97630513_yandex_cleaning_serv.telega_crm_leads 
DROP CONSTRAINT telega_crm_leads_project_id_fkey;

-- Добавляем правильный foreign key
ALTER TABLE t_p97630513_yandex_cleaning_serv.telega_crm_leads 
ADD CONSTRAINT telega_crm_leads_project_id_fkey 
FOREIGN KEY (project_id) 
REFERENCES t_p97630513_yandex_cleaning_serv.telega_crm_projects(id);