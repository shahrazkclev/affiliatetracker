
DO $$
DECLARE
    v_org_id UUID;
BEGIN
    -- Assume inserting into the first organization
    SELECT id INTO v_org_id FROM organizations LIMIT 1;

    IF v_org_id IS NULL THEN
        INSERT INTO organizations (name) VALUES ('PromoteKit Org') RETURNING id INTO v_org_id;
    END IF;

    -- Upsert Campaigns
    INSERT INTO campaigns (id, org_id, name, default_commission_percent, is_default, created_at)
    VALUES ('22f20831-2278-4bfc-9e9b-9189b8f5690d', v_org_id, 'The Lazy-Motion Library Daimond', 40, false, '2024-11-17T17:31:50.231262+00:00')
    ON CONFLICT DO NOTHING;
    INSERT INTO campaigns (id, org_id, name, default_commission_percent, is_default, created_at)
    VALUES ('d63cb1ba-5277-4131-93bb-b92f2ac05254', v_org_id, 'The Lazy-Motion Library', 30, true, '2024-12-13T23:52:11.868533+00:00')
    ON CONFLICT DO NOTHING;
    INSERT INTO campaigns (id, org_id, name, default_commission_percent, is_default, created_at)
    VALUES ('1c203662-bb81-4908-8162-61868d219728', v_org_id, 'Lm Library', 15, false, '2024-12-17T11:17:53.068959+00:00')
    ON CONFLICT DO NOTHING;

    -- Upsert Affiliates
    INSERT INTO affiliates (id, org_id, campaign_id, name, email, payout_email, referral_code, status, clicks, total_commission, created_at)
    VALUES ('4a8cce87-dad5-41fa-8a95-7fe99d45e3f7', v_org_id, 'd63cb1ba-5277-4131-93bb-b92f2ac05254', 'Najaf ali', 'awannajafali460@gmail.com', 'awannajafali460@gmail.com', 'GenZ', 'active', 0, 30, '2026-02-27T08:07:05.493775+00:00')
    ON CONFLICT DO NOTHING;
    INSERT INTO affiliates (id, org_id, campaign_id, name, email, payout_email, referral_code, status, clicks, total_commission, created_at)
    VALUES ('ade4e10d-fd34-408a-928c-5d1e851bf689', v_org_id, 'd63cb1ba-5277-4131-93bb-b92f2ac05254', 'tiktok khan', 'cleverpolytiktokzrp@gmail.com', 'cleverpolytiktokzrp@gmail.com', 'tiktok', 'active', 7034, 30, '2026-01-31T08:55:29.527714+00:00')
    ON CONFLICT DO NOTHING;
    INSERT INTO affiliates (id, org_id, campaign_id, name, email, payout_email, referral_code, status, clicks, total_commission, created_at)
    VALUES ('83a1cda4-302b-499e-b2ae-f914ed3f162e', v_org_id, 'd63cb1ba-5277-4131-93bb-b92f2ac05254', 'meta insta', 'metaclev@cleverpoly.store', 'metaclev@cleverpoly.store', 'meta', 'active', 2339, 30, '2026-01-29T16:32:37.704402+00:00')
    ON CONFLICT DO NOTHING;
    INSERT INTO affiliates (id, org_id, campaign_id, name, email, payout_email, referral_code, status, clicks, total_commission, created_at)
    VALUES ('4e32a2f1-210e-44b4-be0d-13dbb2067d08', v_org_id, 'd63cb1ba-5277-4131-93bb-b92f2ac05254', 'Sheraz Yousaf', 'sherry3d08@gmail.com', 'sherry3d08@gmail.com', 'Sherry3D', 'active', 12, 30, '2026-01-26T14:11:50.110837+00:00')
    ON CONFLICT DO NOTHING;
    INSERT INTO affiliates (id, org_id, campaign_id, name, email, payout_email, referral_code, status, clicks, total_commission, created_at)
    VALUES ('a9ef64fb-0b0b-43c6-a0e9-286235e46cfb', v_org_id, 'd63cb1ba-5277-4131-93bb-b92f2ac05254', 'Jonas Meyer', 'jonasmeyerulm@googlemail.com', 'jonasmeyerulm@googlemail.com', 'jons', 'active', 0, 30, '2026-01-25T16:04:37.004166+00:00')
    ON CONFLICT DO NOTHING;
    INSERT INTO affiliates (id, org_id, campaign_id, name, email, payout_email, referral_code, status, clicks, total_commission, created_at)
    VALUES ('69a48650-6508-4b77-9dd0-9bb5d8c2b6a4', v_org_id, 'd63cb1ba-5277-4131-93bb-b92f2ac05254', 'Salma Yehia', 'salmayehiaaaa@gmail.com', 'salmayehiaaaa@gmail.com', 'salma', 'active', 0, 30, '2026-01-25T15:17:22.991591+00:00')
    ON CONFLICT DO NOTHING;
    INSERT INTO affiliates (id, org_id, campaign_id, name, email, payout_email, referral_code, status, clicks, total_commission, created_at)
    VALUES ('b73d7a0c-ed90-493e-bb92-5d75903025ad', v_org_id, 'd63cb1ba-5277-4131-93bb-b92f2ac05254', 'Adam Darázs', 'adadara39@gmail.com', 'adadara39@gmail.com', 'Ada', 'active', 0, 30, '2026-01-09T20:23:06.64213+00:00')
    ON CONFLICT DO NOTHING;
    INSERT INTO affiliates (id, org_id, campaign_id, name, email, payout_email, referral_code, status, clicks, total_commission, created_at)
    VALUES ('bb2fad36-c554-45da-986f-e5f548cfb453', v_org_id, 'd63cb1ba-5277-4131-93bb-b92f2ac05254', 'Haris Khan', 'ask.haris193@gmail.com', 'ask.haris193@gmail.com', 'haris', 'active', 135, 30, '2025-12-30T19:32:48.581565+00:00')
    ON CONFLICT DO NOTHING;
    INSERT INTO affiliates (id, org_id, campaign_id, name, email, payout_email, referral_code, status, clicks, total_commission, created_at)
    VALUES ('20e78e19-e6f9-4ef7-a223-1bc5d6a4f082', v_org_id, 'd63cb1ba-5277-4131-93bb-b92f2ac05254', 'Nadeem kaif', 'essencestudio800@gmail.com', 'essencestudio800@gmail.com', 'Nadeem', 'active', 0, 30, '2025-11-11T05:41:05.691229+00:00')
    ON CONFLICT DO NOTHING;
    INSERT INTO affiliates (id, org_id, campaign_id, name, email, payout_email, referral_code, status, clicks, total_commission, created_at)
    VALUES ('a0b2012d-237b-40ce-a40e-2e55cc29603c', v_org_id, 'd63cb1ba-5277-4131-93bb-b92f2ac05254', 'Nicholas Ashroft', 'nicholasashcroft@gmail.com', 'nicholasashcroft@gmail.com', 'nicholasashcroft', 'active', 0, 30, '2025-11-04T20:58:41.061974+00:00')
    ON CONFLICT DO NOTHING;
    INSERT INTO affiliates (id, org_id, campaign_id, name, email, payout_email, referral_code, status, clicks, total_commission, created_at)
    VALUES ('e3991197-8a5d-4438-864f-f712db5fd29c', v_org_id, '22f20831-2278-4bfc-9e9b-9189b8f5690d', 'Fatima Sultan', 'askfatima.fusion@gmail.com', 'askfatima.fusion@gmail.com', 'fatima', 'active', 579, 40, '2025-10-29T17:00:45.587879+00:00')
    ON CONFLICT DO NOTHING;
    INSERT INTO affiliates (id, org_id, campaign_id, name, email, payout_email, referral_code, status, clicks, total_commission, created_at)
    VALUES ('2f54d413-a64c-4e5b-8a32-cc84bc32f88b', v_org_id, 'd63cb1ba-5277-4131-93bb-b92f2ac05254', 'chap1  course', 'chap1video@gmail.com', 'chap1video@gmail.com', 'ch1', 'active', 98, 30, '2025-10-25T20:37:06.230004+00:00')
    ON CONFLICT DO NOTHING;
    INSERT INTO affiliates (id, org_id, campaign_id, name, email, payout_email, referral_code, status, clicks, total_commission, created_at)
    VALUES ('064e02af-9784-4971-8a15-d6f27c62246b', v_org_id, 'd63cb1ba-5277-4131-93bb-b92f2ac05254', 'not your skills video', 'notyourskillsvideo@gmail.com', 'notyourskillsvideo@gmail.com', 'ntyskl', 'active', 21, 30, '2025-10-25T20:35:12.317017+00:00')
    ON CONFLICT DO NOTHING;
    INSERT INTO affiliates (id, org_id, campaign_id, name, email, payout_email, referral_code, status, clicks, total_commission, created_at)
    VALUES ('55e5a219-d132-4b58-9ec8-3b6abbea8218', v_org_id, 'd63cb1ba-5277-4131-93bb-b92f2ac05254', 'fix portfolio', 'cleverpolyFixyourPortfolio@gmail.com', 'cleverpolyFixyourPortfolio@gmail.com', 'yt1', 'active', 60, 30, '2025-08-28T16:26:24.680155+00:00')
    ON CONFLICT DO NOTHING;
    INSERT INTO affiliates (id, org_id, campaign_id, name, email, payout_email, referral_code, status, clicks, total_commission, created_at)
    VALUES ('2c586603-2190-4313-919b-af85f4d0c109', v_org_id, 'd63cb1ba-5277-4131-93bb-b92f2ac05254', 'hussain Irtza', 'hussainirtza3d@gmail.com', 'hussainirtza3d@gmail.com', 'hussain3d', 'active', 0, 30, '2025-05-25T19:27:37.952118+00:00')
    ON CONFLICT DO NOTHING;
    INSERT INTO affiliates (id, org_id, campaign_id, name, email, payout_email, referral_code, status, clicks, total_commission, created_at)
    VALUES ('09584d5e-c9f6-4258-9466-9fa96e55e159', v_org_id, 'd63cb1ba-5277-4131-93bb-b92f2ac05254', 'Rahil Soni', 'rahilsoni3d@gmail.com', 'rahilsoni3d@gmail.com', 'rahil', 'active', 0, 30, '2025-05-25T19:27:20.243072+00:00')
    ON CONFLICT DO NOTHING;
    INSERT INTO affiliates (id, org_id, campaign_id, name, email, payout_email, referral_code, status, clicks, total_commission, created_at)
    VALUES ('eea2b897-5281-44b2-9a72-0d8e768c4e16', v_org_id, 'd63cb1ba-5277-4131-93bb-b92f2ac05254', 'Hassan Omer', 'omerh223@gmail.com', 'omerh223@gmail.com', 'Hassan', 'active', 0, 30, '2025-05-25T16:18:01.873948+00:00')
    ON CONFLICT DO NOTHING;
    INSERT INTO affiliates (id, org_id, campaign_id, name, email, payout_email, referral_code, status, clicks, total_commission, created_at)
    VALUES ('a7ca1a59-baa9-4457-a5d9-f57f6293a54d', v_org_id, 'd63cb1ba-5277-4131-93bb-b92f2ac05254', 'Shayan Khan', 'askshayan47@gmail.com', 'askshayan47@gmail.com', 'SHN', 'active', 185, 30, '2025-05-25T12:19:27.485312+00:00')
    ON CONFLICT DO NOTHING;
    INSERT INTO affiliates (id, org_id, campaign_id, name, email, payout_email, referral_code, status, clicks, total_commission, created_at)
    VALUES ('eed78d95-b992-469a-b279-d1107b08000b', v_org_id, 'd63cb1ba-5277-4131-93bb-b92f2ac05254', 'ask Nk', 'anselemnkoro@gmail.com', 'anselemnkoro@gmail.com', 'askNk', 'active', 0, 30, '2025-04-05T18:32:31.985115+00:00')
    ON CONFLICT DO NOTHING;
    INSERT INTO affiliates (id, org_id, campaign_id, name, email, payout_email, referral_code, status, clicks, total_commission, created_at)
    VALUES ('0e7ce22f-e0ca-4aa8-8bb0-186cb90ccaee', v_org_id, 'd63cb1ba-5277-4131-93bb-b92f2ac05254', 'Muhammad Refaei', 'refaeibusiness@gmail.com', 'refaeibusiness@gmail.com', 'refaei10', 'active', 1, 30, '2025-03-27T11:55:43.516122+00:00')
    ON CONFLICT DO NOTHING;
    INSERT INTO affiliates (id, org_id, campaign_id, name, email, payout_email, referral_code, status, clicks, total_commission, created_at)
    VALUES ('3c0fd591-ed86-4102-9074-7c63dcf6dcee', v_org_id, 'd63cb1ba-5277-4131-93bb-b92f2ac05254', 'abdullah Shahzad', 'abihabdullah03@gmail.com', 'abihabdullah03@gmail.com', '3dbyabdull', 'active', 36, 30, '2025-03-21T00:44:49.916051+00:00')
    ON CONFLICT DO NOTHING;
    INSERT INTO affiliates (id, org_id, campaign_id, name, email, payout_email, referral_code, status, clicks, total_commission, created_at)
    VALUES ('3dc412c5-a0c4-4234-89d5-042028a4b8ef', v_org_id, 'd63cb1ba-5277-4131-93bb-b92f2ac05254', 'Alan Wayne', 'alanwayne4940@gmail.com', 'alanwayne4940@gmail.com', 'Alan', 'active', 72, 30, '2025-03-06T09:41:07.775227+00:00')
    ON CONFLICT DO NOTHING;
    INSERT INTO affiliates (id, org_id, campaign_id, name, email, payout_email, referral_code, status, clicks, total_commission, created_at)
    VALUES ('c6e7dc67-df7c-4572-aad1-c4120f743289', v_org_id, 'd63cb1ba-5277-4131-93bb-b92f2ac05254', 'Creative Sav', 'thecreativesav@gmail.com', 'thecreativesav@gmail.com', 'discount10sav', 'active', 359, 30, '2025-02-20T09:39:16.163684+00:00')
    ON CONFLICT DO NOTHING;
    INSERT INTO affiliates (id, org_id, campaign_id, name, email, payout_email, referral_code, status, clicks, total_commission, created_at)
    VALUES ('4fe67adb-3238-459d-9ba4-2af945ed1242', v_org_id, 'd63cb1ba-5277-4131-93bb-b92f2ac05254', 'Haadi Mohammed', 'work.haadimohammed@gmail.com', 'work.haadimohammed@gmail.com', 'mafriend', 'active', 1318, 30, '2025-02-18T20:55:57.018098+00:00')
    ON CONFLICT DO NOTHING;
    INSERT INTO affiliates (id, org_id, campaign_id, name, email, payout_email, referral_code, status, clicks, total_commission, created_at)
    VALUES ('3867c492-52ad-4c7d-a05f-7aa16664b539', v_org_id, 'd63cb1ba-5277-4131-93bb-b92f2ac05254', 'Angela Ryu', 'angelaryu@ryuxrstudio.com', 'angelaryu@ryuxrstudio.com', 'Ryuxrstudio', 'active', 66, 30, '2025-02-12T05:01:01.383969+00:00')
    ON CONFLICT DO NOTHING;
    INSERT INTO affiliates (id, org_id, campaign_id, name, email, payout_email, referral_code, status, clicks, total_commission, created_at)
    VALUES ('713e1234-58aa-4456-b800-8d5912eaa269', v_org_id, 'd63cb1ba-5277-4131-93bb-b92f2ac05254', 'Abdul Ahad', 'abdulahadjanjua2022@gmail.com', 'abdulahadjanjua2022@gmail.com', 'AhadAninmates', 'active', 686, 30, '2025-01-29T14:39:53.162144+00:00')
    ON CONFLICT DO NOTHING;
    INSERT INTO affiliates (id, org_id, campaign_id, name, email, payout_email, referral_code, status, clicks, total_commission, created_at)
    VALUES ('311b8341-8974-4d25-a6c8-864c4111c15b', v_org_id, 'd63cb1ba-5277-4131-93bb-b92f2ac05254', 'Nickel Impson', 'contact@nickel3d.com', 'contact@nickel3d.com', 'nickel3d', 'active', 0, 30, '2024-12-20T14:36:43.601009+00:00')
    ON CONFLICT DO NOTHING;
    INSERT INTO affiliates (id, org_id, campaign_id, name, email, payout_email, referral_code, status, clicks, total_commission, created_at)
    VALUES ('61595a26-6583-4b5d-830e-b724f548b5d9', v_org_id, 'd63cb1ba-5277-4131-93bb-b92f2ac05254', 'Levar Boutte', '1polygonewithme@gmail.com', '1polygonewithme@gmail.com', '1polygonewithme', 'active', 34, 30, '2024-12-19T02:23:00.683469+00:00')
    ON CONFLICT DO NOTHING;
    INSERT INTO affiliates (id, org_id, campaign_id, name, email, payout_email, referral_code, status, clicks, total_commission, created_at)
    VALUES ('55599e12-2814-40ae-9f8d-a6aaf53adef1', v_org_id, '1c203662-bb81-4908-8162-61868d219728', 'Aram Kokchian', 'lusinearestakyan777@gmail.com', 'lusinearestakyan777@gmail.com', 'Doodles', 'active', 67, 15, '2024-12-17T11:02:37.592008+00:00')
    ON CONFLICT DO NOTHING;
    INSERT INTO affiliates (id, org_id, campaign_id, name, email, payout_email, referral_code, status, clicks, total_commission, created_at)
    VALUES ('db745625-1cf9-4aea-b85c-5eb24343a2fd', v_org_id, 'd63cb1ba-5277-4131-93bb-b92f2ac05254', 'Andy M', 'support@andym.digital', 'support@andym.digital', 'andymvis', 'active', 3033, 30, '2024-12-16T06:45:27.871701+00:00')
    ON CONFLICT DO NOTHING;
    INSERT INTO affiliates (id, org_id, campaign_id, name, email, payout_email, referral_code, status, clicks, total_commission, created_at)
    VALUES ('e48b7a8c-853a-4298-82e2-580beb1241aa', v_org_id, 'd63cb1ba-5277-4131-93bb-b92f2ac05254', 'Zaid Awan', 'mzzaid73@gmail.com', 'mzzaid73@gmail.com', 'zaidawan', 'active', 1, 30, '2024-12-15T18:06:22.781646+00:00')
    ON CONFLICT DO NOTHING;
    INSERT INTO affiliates (id, org_id, campaign_id, name, email, payout_email, referral_code, status, clicks, total_commission, created_at)
    VALUES ('74291183-d87e-4e30-abc4-56ae0bb2aa38', v_org_id, 'd63cb1ba-5277-4131-93bb-b92f2ac05254', 'Rushil V', 'rushilvasudeva.design@gmail.com', 'rushilvasudeva.design@gmail.com', 'rushil', 'active', 0, 30, '2024-12-15T17:47:58.854479+00:00')
    ON CONFLICT DO NOTHING;
    INSERT INTO affiliates (id, org_id, campaign_id, name, email, payout_email, referral_code, status, clicks, total_commission, created_at)
    VALUES ('c0d58497-47c2-495f-83cc-b31e49822fed', v_org_id, 'd63cb1ba-5277-4131-93bb-b92f2ac05254', 'Hisham Farooqui', 'apeiro3d@gmail.com', 'apeiro3d@gmail.com', 'Hish', 'active', 81, 30, '2024-12-14T10:31:45.755792+00:00')
    ON CONFLICT DO NOTHING;
    INSERT INTO affiliates (id, org_id, campaign_id, name, email, payout_email, referral_code, status, clicks, total_commission, created_at)
    VALUES ('4a4de88a-4380-49a7-a0fd-a07078905da4', v_org_id, 'd63cb1ba-5277-4131-93bb-b92f2ac05254', 'Maniha Tahir', 'maniha.tahir@gmail.com', 'maniha.tahir@gmail.com', 'maniha', 'active', 250, 30, '2024-12-14T09:35:57.384437+00:00')
    ON CONFLICT DO NOTHING;
    INSERT INTO affiliates (id, org_id, campaign_id, name, email, payout_email, referral_code, status, clicks, total_commission, created_at)
    VALUES ('af7b4478-24de-40c9-a71f-add463b2a505', v_org_id, 'd63cb1ba-5277-4131-93bb-b92f2ac05254', 'Ahmad ali', 'ask.productshade@gmail.com', 'ask.productshade@gmail.com', 'alf', 'active', 1934, 30, '2024-12-14T09:17:29.810923+00:00')
    ON CONFLICT DO NOTHING;
    INSERT INTO affiliates (id, org_id, campaign_id, name, email, payout_email, referral_code, status, clicks, total_commission, created_at)
    VALUES ('289b98ae-e8cf-471d-9593-65937bbd0bad', v_org_id, 'd63cb1ba-5277-4131-93bb-b92f2ac05254', 'Zaid Ali', 'askzaid133@gmail.com', 'askzaid133@gmail.com', 'jani', 'active', 3544, 30, '2024-12-14T08:48:45.942995+00:00')
    ON CONFLICT DO NOTHING;
    INSERT INTO affiliates (id, org_id, campaign_id, name, email, payout_email, referral_code, status, clicks, total_commission, created_at)
    VALUES ('a0fe80c7-f830-4ef0-95f6-8b67afc85175', v_org_id, '22f20831-2278-4bfc-9e9b-9189b8f5690d', 'test test', 'shz576044@gmail.com', 'shz576044@gmail.com', 'test', 'active', 0, 40, '2024-12-14T00:25:10.642688+00:00')
    ON CONFLICT DO NOTHING;
END $$;
