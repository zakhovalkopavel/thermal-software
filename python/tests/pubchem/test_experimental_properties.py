"""Flatten Experimental Properties into heading + citation[]; catalog sources without page."""
from __future__ import annotations

from pathlib import Path

from pubchem.experimental_value import ExperimentalCitation, ExperimentalProperty, ExperimentalQuantity
from pubchem.parsers.experimental_properties import (
    canonicalize_source, citation_ref_code, depositor_ref_code, normalize_source, page_of,
    parse_experimental, parse_quantities, preferred_ref_code, strip_page,
)
from pubchem.pubchem_records_writer import append_pubchem_record, compact_pubchem_files
from pubchem.pubchem_references import read_pubchem_references, register_sources
from pubchem.pubchem_view import PubchemView
from pubchem_fixtures import pubchem_record

_CRC = (
    "Lide, D.R. CRC Handbook of Chemistry and Physics 88TH Edition 2007-2008. "
    "CRC Press, Taylor & Francis, Boca Raton, FL 2007, p. 4-57"
)
_CRC_OTHER = (
    "Haynes, W.M. (ed.). CRC Handbook of Chemistry and Physics 88TH Edition 2007-2008. "
    "CRC Press, Boca Raton, FL 2007, p. 4-57"
)
_MERCK = "O'Neil, M.J. (ed.). The Merck Index - An Encyclopedia of Chemicals. Cambridge, 2013., p. 396"
_Q = ExperimentalQuantity


def _body() -> dict:
    return {
        "Record": {
            "RecordNumber": 62750,
            "Reference": [{
                "ReferenceNumber": 24, "SourceName": "Hazardous Substances Data Bank (HSDB)",
                "SourceID": "7906", "Name": "X", "Description": "Long HSDB essay — must not be stored",
                "URL": "https://example.test/hsdb", "ANID": 99, "IsToxnet": True,
            }],
            "Section": [{"TOCHeading": "Experimental Properties", "Section": [
                {"TOCHeading": "Melting Point", "Information": [{
                    "ReferenceNumber": 24,
                    "Description": "PEER REVIEWED",
                    "Reference": [_CRC, _MERCK],
                    "Value": {"StringWithMarkup": [{"String": "342.3 °C"}]},
                }]},
            ]}],
        },
    }


class TestParseQuantities:
    def test_keeps_original_and_splits_spec_number_unit(self):
        text = "Red: Triple point = 590 °C; sublimation point = 431 °C"
        assert parse_quantities(text) == [
            _Q(590.0, "°C", "Red: Triple point"),
            _Q(431.0, "°C", "sublimation point"),
        ]

    def test_range_shares_unit(self):
        assert parse_quantities("100-120 °C") == [_Q(100.0, "°C"), _Q(120.0, "°C")]

    def test_comma_thousands_and_fahrenheit(self):
        assert parse_quantities("MP: 1,605 °C") == [_Q(1605.0, "°C", "MP")]
        assert parse_quantities("1517 °F") == [_Q(1517.0, "°F")]

    def test_density_unit(self):
        assert parse_quantities("7.23 g/cm³") == [_Q(7.23, "g/cm³")]

    def test_no_quantity(self):
        assert parse_quantities("white") == []


class TestCanonicalSource:
    def test_page_tail_is_a_locator(self):
        sax = ("Lewis, R.J. Sr. (ed) Sax's Dangerous Properties of Industrial Materials. "
               "11th Edition. Wiley-Interscience, Wiley & Sons, Inc. Hoboken, NJ. 2004., : 870")
        bare = sax.replace(", : 870", "")
        assert canonicalize_source(sax) == (canonicalize_source(bare)[0], "870")
        kirk = ("Kirk-Othmer Encyclopedia of Chemical Technology. 4th ed. Volumes 1: New York, NY. "
                "John Wiley and Sons, 1991-Present., : 73 (1997)")
        assert canonicalize_source(kirk)[1] == "73"
        assert canonicalize_source("… 1978., /231")[1] == "231"
        doe = ("U.S. Department of Energy; Guide of Good Practices for Occupational Radiological "
               "Protection in Plutonium Facilities. p 2-17 DOE-STD-1128-98 (1998)")
        other = doe.replace("p 2-17 ", "p 2-6 ")
        assert canonicalize_source(doe)[0] == canonicalize_source(other)[0]
        assert canonicalize_source(doe)[1] == "2-17"

    def test_database_drops_the_chemical(self):
        one = ("NOAA; CAMEO Chemicals. Database of Hazardous Materials. Vanadium Trioxide (1314-34-7). "
               "Natl Ocean Atmos Admin. Available from, as of April 8, 2016: https://cameochemicals.noaa.gov/")
        two = one.replace("Vanadium Trioxide (1314-34-7)", "Vanadium Oxide (1314-62-1)")
        assert canonicalize_source(one) == canonicalize_source(two)
        assert canonicalize_source(one)[0].startswith("NOAA; CAMEO Chemicals")
        chris = ("U.S. Coast Guard, Department of Transportation. CHRIS - Hazardous Chemical Data. (1999). "
                 "Available from, as of Sept 22, 2009: https://cameochemicals.noaa.gov/chris/CMO.pdf")
        assert "CAMEO" not in canonicalize_source(chris)[0]

    def test_same_article_ignores_coverage_years(self):
        first = ("Hoffman JE, King MG; Kirk-Othmer Encyclopedia of Chemical Technology. (1999-2011). "
                 "New York, NY: John Wiley & Sons; Selenium and Selenium Compounds. "
                 "Online Posting Date: February 22, 2011")
        second = first.replace("(1999-2011)", "(2010)").replace("New York, NY", "NY, NY")
        other = first.replace("Selenium and Selenium Compounds", "Sulfur Compounds")
        assert canonicalize_source(first) == canonicalize_source(second) == canonicalize_source(other)
        assert canonicalize_source(first)[0] == "Kirk-Othmer Encyclopedia of Chemical Technology."

    def test_pmid_and_merck_editions_stay_apart(self):
        assert canonicalize_source("PMID:6376602")[0] != canonicalize_source("PMID:11563639")[0]
        merck_1996 = ("Budavari, S. (ed.). The Merck Index - An Encyclopedia of Chemicals, Drugs, "
                      "and Biologicals. Whitehouse Station, NJ: Merck and Co., Inc., 1996")
        merck_2001 = merck_1996.replace("1996", "2001")
        assert normalize_source(canonicalize_source(merck_1996)[0]) != normalize_source(
            canonicalize_source(merck_2001)[0])
        kirk = ("Kirk-Othmer Encyclopedia of Chemical Technology. 4th ed. Volumes 1: New York, NY. "
                "John Wiley and Sons, 1991-Present")
        paged = kirk + "., 689 (1995)"
        assert normalize_source(canonicalize_source(kirk)[0]) == normalize_source(canonicalize_source(paged)[0])
        assert canonicalize_source(paged)[1] == "689"
        volume_1 = "Fenaroli's Handbook of Flavor Ingredients. Volume 1. 2nd ed. Cleveland: The Chemical Rubber Co., 1975"
        volume_2 = volume_1.replace("Volume 1", "Volume 2")
        assert canonicalize_source(volume_1)[0] == canonicalize_source(volume_2)[0]
        assert canonicalize_source(volume_1)[1] == "1"
        sax_11 = "Sax, N.I. Dangerous Properties of Industrial Materials. 11th ed. Hoboken, NJ. 2004"
        sax_12 = sax_11.replace("11th", "12th").replace("2004", "2012")
        assert normalize_source(canonicalize_source(sax_11)[0]) != normalize_source(
            canonicalize_source(sax_12)[0])
        assert normalize_source("Atkinson R et al; Atmos Chem Phys 6") != normalize_source(
            "Atkinson R et al; Atmos Chem Phys 8")
        monograph_1 = "Atkinson R; J Phys Chem Ref Data Monograph 1 (1989)"
        monograph_2 = "Atkinson R; J Phys Chem Ref Data Monograph 2 (1994)"
        assert normalize_source(canonicalize_source(monograph_1)[0]) != normalize_source(
            canonicalize_source(monograph_2)[0])
        hydrocarbons = "Kirk-Othmer Encyclopedia of Chemical Technology. Hydrocarbons C1-C6"
        assert normalize_source(hydrocarbons) == normalize_source(hydrocarbons.replace("C1-C6", ", C1-C6"))
        perry_ny = "Perry RH, Green D; Perry's Chemical Handbook. Physical and Chemical Data. NY, NY: McGraw-Hill 6th ed (1984)"
        perry_full = "Perry RH, Green D; Perry's Chemical Handbook. Physical and Chemical Data. 6th ed., New York, NY: McGraw Hill (1984)"
        perry_engineer = "Perry RH, Green D; Perry's Chemical Engineer's Handbook 6th ed New York, NY: McGraw-Hill, Inc (1984)"
        assert canonicalize_source(perry_ny)[0] == canonicalize_source(perry_full)[0] == canonicalize_source(perry_engineer)[0]
        ullmann_article = "Ullmann's Encyclopedia of Industrial Chemistry. 7th ed. Charcoal"
        ullmann_other = "Ullmann's Encyclopedia of Industrial Chemistry. 7th ed. Sulfur"
        ullmann_5 = ("Gerhartz, W. (exec ed.). Ullmann's Encyclopedia of Industrial Chemistry. "
                     "5th ed.Vol A1: Deerfield Beach, FL: VCH Publishers, 1985 to Present")
        assert canonicalize_source(ullmann_article)[0] == canonicalize_source(ullmann_other)[0]
        assert canonicalize_source(ullmann_5)[0] != canonicalize_source(ullmann_article)[0]
        hawley_ny = "Hawley's Condensed Chemical Dictionary. 13th ed. New York, NY: John Wiley & Sons, Inc. 1997"
        hawley_short = "Hawley's Condensed Chemical Dictionary. 13th ed. NY, NY: John Wiley & Sons, 1997"
        assert normalize_source(hawley_ny) == normalize_source(hawley_short)

    def test_niosh_publication_numbers_stay_apart(self):
        earlier = "NIOSH Pocket Guide … Publication No. 2005-151 (2005)"
        later = "NIOSH. NIOSH Pocket Guide to Chemical Hazards. Publication No. 2005-149 (2005)"
        assert "2005-151" in canonicalize_source(earlier)[0]
        assert "2005-149" in canonicalize_source(later)[0]
        short = "NIOSH. NIOSH Pocket Guide to Chemical Hazards. Publication No. 97-140 (1997)"
        other = short.replace("97-140", "94-116")
        assert canonicalize_source(short)[0] != canonicalize_source(other)[0]
        assert preferred_ref_code("NIOSHNIOSHPocketGuide-2005-2", later) == "NIOSHNIOSHPocketGuide-2005-149"
        assert preferred_ref_code("NIOSHNIOSHPocketGuide-2010", earlier.replace("2005-151", "2010-168")) == (
            "NIOSHNIOSHPocketGuide-2010-168")

    def test_year_edition_and_volume_groups(self):
        perrin = ("Perrin DD; Dissociation constants of organic bases in aqueous solution. "
                  "IUPAC Chem Data Ser, Buttersworth, London (1965)")
        perrin_spelling = ("Perrin DD; Dissociation Constants of Organic Bases in Aqueous Solution, "
                           "IUPAC Chemical Data Series. London, UK: Buttersworth (1965)")
        perrin_1972 = ("Perrin DD; Dissociation Constants of Organic Bases in Aqueous Solution. "
                       "IUPAC Chem Data Ser: Suppl 1972 Buttersworth, London, (1972)")
        assert canonicalize_source(perrin)[0] == canonicalize_source(perrin_spelling)[0]
        assert canonicalize_source(perrin)[0].endswith("(1965)")
        assert canonicalize_source(perrin)[0] != canonicalize_source(perrin_1972)[0]
        assert canonicalize_source(
            "Perrin DD; Dissociation Constants of Organic Bases in Aqueous Solution. "
            "London: Buttersworth & Co p 197 (1965)")[1] == "197"

        merck_2001 = ("Budavari, S. (ed.). The Merck Index - An Encyclopedia of Chemicals, Drugs, "
                      "and Biologicals. Whitehouse Station, NJ: Merck and Co., Inc., 2001")
        merck_13 = ("O'Neil, M.J. (ed.). The Merck Index - An Encyclopedia of Chemicals, Drugs, "
                    "and Biologicals. 13th ed, Whitehouse Station, NJ: Merck and Co., Inc., 2001")
        merck_short = "MERCK INDEX (1996)"
        merck_1996 = ("Budavari, S. (ed.). The Merck Index - An Encyclopedia of Chemicals, Drugs, "
                      "and Biologicals. Whitehouse Station, NJ: Merck and Co., Inc., 1996")
        assert canonicalize_source(merck_2001)[0] == canonicalize_source(merck_13)[0]
        assert canonicalize_source(merck_short)[0] == canonicalize_source(merck_1996)[0]
        assert canonicalize_source(merck_2001)[0] != canonicalize_source(merck_1996)[0]

        monograph = "Atkinson R; J Phys Chem Ref Data Monograph 1 (1989)"
        monograph_no = "Atkinson R; J Phys Chem Ref Data Monograph No. 1 (1989)"
        monograph_1994 = "Atkinson R; J Phys Chem Ref Data Mongraph No. 2 (1994)"
        assert canonicalize_source(monograph)[0] == canonicalize_source(monograph_no)[0]
        assert canonicalize_source(monograph)[0] != canonicalize_source(monograph_1994)[0]
        journal = "Atkinson R; Journal of Physical and Chemical Reference Data. Monograph 2 (1994)"
        assert canonicalize_source(journal)[0] == canonicalize_source(monograph_1994)[0]
        no_word = "Atkinson R; J Phys Chem Ref Data No 1 (1989)"
        year_only = "Atkinson R; J Phys Chem Ref Data (1989)"
        assert canonicalize_source(no_word)[0] == canonicalize_source(year_only)[0] == canonicalize_source(monograph)[0]
        assert canonicalize_source("Atkinson R et al; J Phys Chem Ref Data 21")[0] != canonicalize_source(monograph)[0]

        fenaroli = "Burdock, G.A. (ed.). Fenaroli's Handbook of Flavor Ingredients. 6th ed.Boca Raton, FL 2010"
        fenaroli_short = ("Burdock GA, ed; Fenaroli's Handbook of Flavor Ingredients. "
                          "6th ed. Boca Raton, FL: CRC Press, (2010)")
        assert canonicalize_source(fenaroli)[0] == canonicalize_source(fenaroli_short)[0]
        assert canonicalize_source(fenaroli)[0] != canonicalize_source(fenaroli.replace("6th", "5th"))[0]

        yaws_3 = ("Yaws CL; Handbook of Vapor Pressure. Vol 3: C8-C28 Compounds. "
                  "Houston, TX: Gulf Pub Co, (1994)")
        yaws_3_other = ("Yaws Cl; Handbook of Vapor Pressure. Volume 3 - C8 to C28 Compounds. "
                        "Houston, TX: Gulf Publishing Co. (1994)")
        yaws_1 = "Yaws CL; Handbook of Vapor Pressure. Vol 1: C1-C4 Compounds. Houston, TX: Gulf Pub Co (1994)"
        assert canonicalize_source(yaws_3)[0] == canonicalize_source(yaws_3_other)[0]
        assert canonicalize_source(yaws_3) == ("Yaws CL; Handbook of Vapor Pressure.", "3")
        assert canonicalize_source(yaws_1)[0] == canonicalize_source(yaws_3)[0]
        assert canonicalize_source(yaws_1)[1] == "1"

        assert canonicalize_source("http://foodb.ca/compounds/FDB015439") == (
            "http://foodb.ca/compounds", "FDB015439")
        assert canonicalize_source("http://foodb.ca/compounds/FDB015440")[0] == "http://foodb.ca/compounds"

        ambrose_8 = "Ambrose D et al; J Chem Therm 8"
        ambrose_full = "Ambrose D et al; J Chem Thermodyn 8"
        assert canonicalize_source(ambrose_8)[0] == canonicalize_source(ambrose_full)[0]
        assert canonicalize_source(ambrose_8)[0].endswith("(1976)")
        assert canonicalize_source(ambrose_8)[0] != canonicalize_source("Ambrose D et al; J Chem Therm 7")[0]

        daubert = ("Daubert, T.E., R.. Physical and Thermodynamic Properties of Pure Chemicals "
                   "Data Compilation. Washington, D.C.: Taylor and Francis, 1989")
        daubert_full = ("Daubert TE, Danner RP; Physical and Thermodynamic Properties of Pure Chemicals "
                        "Data Compilation. Washington, DC: Taylor and Francis (1989)")
        dippr = ("Daubert TE, Danner RP; Physical and Thermodynamic Properties of Pure Chemicals: "
                 "Data Compilation. Design Institute for Physical Property Data. New York, NY: "
                 "Hemisphere Pub Corp (1999)")
        assert canonicalize_source(daubert)[0] == canonicalize_source(daubert_full)[0]
        assert canonicalize_source(daubert)[0] != canonicalize_source(daubert.replace("1989", "1995"))[0]
        assert canonicalize_source(dippr)[0].endswith("(1999)")
        assert canonicalize_source(dippr)[0] != canonicalize_source(daubert)[0]
        greyden = ("Daubert TE et al; Physical and Thermodynamic Properties of Pure Chemicals "
                    "Data Compilation. Columbus, OH: Greyden Press (1999)")
        assert "Greyden" in canonicalize_source(greyden)[0]
        assert canonicalize_source(greyden)[0] != canonicalize_source(dippr)[0]

        pesticide = ("MacBean C, ed; e-Pesticide Manual. 15th ed., ver. 5.1, Alton, UK; "
                     "British Crop Protection Council. Zinc phosphide (1314-84-7) (2008-2010)")
        other_chemical = pesticide.replace("Zinc phosphide (1314-84-7)", "Aluminum phosphide (20859-73-8)")
        assert canonicalize_source(pesticide)[0] == canonicalize_source(other_chemical)[0]
        assert canonicalize_source(pesticide)[0].endswith("British Crop Protection Council.")
        assert canonicalize_source(pesticide)[1] == "Zinc phosphide (1314-84-7)"

        hsdb = "National Library of Medicine HSDB Database"
        assert canonicalize_source(hsdb)[0] == canonicalize_source("MSDS, " + hsdb)[0]

        assert canonicalize_source("http://www.chemspider.com/Chemical-Structure.10654.html") == (
            "http://www.chemspider.com", "Chemical-Structure.10654.html")
        assert canonicalize_source("https://pubchem.ncbi.nlm.nih.gov/compound/Magnesium#section=Odor")[0] == (
            "https://pubchem.ncbi.nlm.nih.gov/")
        assert canonicalize_source("http://www.inchem.org/documents/icsc/icsc/eics0951.htm")[0] == (
            "http://www.inchem.org")
        assert canonicalize_source(
            "# http://www.chemicalbook.com/ProductChemicalPropertiesCB3852587_EN.htm")[0] == (
            "https://www.chemicalbook.com/")

        yaws_106 = "Yaws CL et al; Chem Eng; 106: 102-105 (1999)"
        assert canonicalize_source(yaws_106) == ("Yaws CL et al; Chem Eng 106 (1999)", "102-105")
        assert canonicalize_source("Yaws CL et al; Chem Eng 97")[0] == "Yaws CL et al; Chem Eng 97 (1990)"
        assert canonicalize_source("Yaws CL et al; Chem Eng; 106")[0] != canonicalize_source(
            "Yaws CL et al; Chem Eng 97")[0]

        vaporization = ("Zwolinski BJ, Wilhoit RC; Handbook of Vapor Pressures and Heats of Vaporization "
                        "of Hydrocarbons and related compounds. API44-TRC101 (1971)")
        formation = ("Zwolinski BJ, Wilhoit RC; Handbook of Vapor Pressures and Heats of Formation "
                     "of Hydrocarbons and Related Compounds. API44-TRC101 (1971)")
        assert canonicalize_source(vaporization)[0] == canonicalize_source(formation)[0]

        fenaroli_volume = ("Fenaroli's Handbook of Flavor Ingredients. Volume 1. Edited, translated, "
                           "and revised by T.E. Furia and N. Bellanca. 2nd ed. Cleveland: "
                           "The Chemical Rubber Co., 1975")
        assert canonicalize_source(fenaroli_volume) == ("Fenaroli's Handbook of Flavor Ingredients.", "1")
        assert canonicalize_source(fenaroli_volume.replace("Volume 1", "Volume 2")) == (
            "Fenaroli's Handbook of Flavor Ingredients.", "2")

        atmos = ("Atkinson R et al; Atmos Chem Phys 8: 4141-96 (2008). Available, as of March 31, 2016: "
                 "https://www.atmos-chem-phys.net/special_issue8.html")
        assert canonicalize_source(atmos) == ("Atkinson R et al; Atmos Chem Phys 8", "4141-96")
        assert canonicalize_source("Atkinson R et al; Atmos Chem Phys 8")[0] == canonicalize_source(atmos)[0]
        assert canonicalize_source("Atkinson R et al; Atmos Chem Phys 6")[0] != canonicalize_source(atmos)[0]

        betterton = ("Betterton EA; in Gaseous Pollutants: Characterization and Cycling, Nriagu JO, Ed. "
                     "John Wiley & Sons, Inc. (1992)")
        betterton_short = "Betterton EA; Gaseous Pollutants. New York, NY: John Wiley and Sons, Inc. (1992)"
        assert canonicalize_source(betterton)[0] == canonicalize_source(betterton_short)[0]

        phosphorus = "Patty's Toxicology. Phosphorus, Selenium, Tellurium, and Sulfur"
        boron = "Patty's Toxicology. 6th ed. Boron"
        fifth = ("Bingham, E.; Cohrssen, B.; Powell, C.H.; Patty's Toxicology Volumes 1-9 5th ed. "
                 "John Wiley & Sons. New York, N.Y. (2001)")
        assert canonicalize_source(phosphorus)[0] == canonicalize_source(boron)[0] == "Patty's Toxicology. 6th ed."
        assert canonicalize_source(fifth)[0] == "Patty's Toxicology. 5th ed."
        assert canonicalize_source(fifth)[0] != canonicalize_source(boron)[0]
        assert canonicalize_source(fifth)[1] == "Volumes 1-9"

        borax = ("Tomlin CDS, ed. Borax (1303-96-4). In: The e-Pesticide Manual, 13th ed Version 3.0 "
                 "(2003-04). Surrey UK, British Crop Protection Council")
        chlorate = ("Tomlin CDS, ed. Sodium chlorate (7775-09-9). In: The e-Pesticide Manual, "
                    "13th ed Version 3.1 (2004-05). Surrey UK, British Crop Protection Council")
        sulfamate = ("Tomlin CDS, ed. Ammonium sulfamate (7773-06-0). In: The e-Pesticide Manual, "
                     "Version 2.2 (2002). Surrey UK, British Crop Protection Council")
        assert canonicalize_source(borax)[0] == "The e-Pesticide Manual, 13th ed Version 3.0"
        assert canonicalize_source(chlorate)[0] == "The e-Pesticide Manual, 13th ed Version 3.1"
        assert canonicalize_source(borax)[0] != canonicalize_source(chlorate)[0]
        assert canonicalize_source(sulfamate)[0] == "The e-Pesticide Manual, Version 2.2"
        assert canonicalize_source(chlorate)[1] == "Sodium chlorate (7775-09-9)"

    def test_same_edition_joins_and_dates_stay(self):
        ullmann = ("Gerhartz, W. (exec ed.). Ullmann's Encyclopedia of Industrial Chemistry. "
                   "5th ed.Vol A1: Deerfield Beach, FL: VCH Publishers, 1985 to Present., p. VA16 (1990)")
        ullmann_bare = ullmann.split("., p.")[0]
        assert canonicalize_source(ullmann)[0] == canonicalize_source(ullmann_bare)[0]
        assert canonicalize_source(ullmann)[1] == "VA16"
        assert "5th" in canonicalize_source(ullmann)[0]
        assert "7th" not in canonicalize_source(ullmann)[0]

        aldrich_2000 = ("Aldrich; Handbook of Fine Chemicals and Laboratory Equipment. 2000-20001. "
                        "Wilwaukee, WI: Alrich Chem Co. p. 641 (2000)")
        aldrich_2003 = aldrich_2000.replace("2000-20001", "2003-2004").replace("(2000)", "(2003)")
        assert canonicalize_source(aldrich_2000)[0] == "Aldrich; Handbook of Fine Chemicals. 2000-2001"
        assert canonicalize_source(aldrich_2000)[0] != canonicalize_source(aldrich_2003)[0]
        assert canonicalize_source(aldrich_2000)[1] == "641"

        phenols = "USEPA; Ambient Water Quality Criteria Doc: Chlorinated Phenols p.C-119 (1980) EPA 440/5-80-032"
        pcbs = phenols.replace("Chlorinated Phenols p.C-119", "Polychlorinated Biphenyls p.A-3").replace(
            "440/5-80-032", "440/5-80-068")
        assert canonicalize_source(phenols)[0] != canonicalize_source(pcbs)[0]
        assert canonicalize_source(phenols)[1] == "C-119"

        crc = ("Lide, D.R. (ed.). CRC Handbook of Chemistry and Physics. 79th ed. "
               "Boca Raton, FL: CRC Press Inc., 1998-1999., p. 3-2693-269")
        assert canonicalize_source(crc)[0] == canonicalize_source(crc.split("., p.")[0])[0]
        assert canonicalize_source(crc)[1] == "3-2693-269"

        dated = ("Bayer Environmental Science; DeltaGuard G Insecticide Granule, MSDS Number 102000015309, "
                 "Version 1.0, Revision Date 06/20/2008")
        assert canonicalize_source(dated)[1] is None
        assert "06/20/2008" in canonicalize_source(dated)[0]

        sittig_1980 = "Sittig M; Handbook of Toxic and Hazardous Chemicals p.151 (1980)"
        sittig_1981 = "Sittig M; Handbook of Toxic and Hazardous Chemicals p.21 (1981)"
        assert canonicalize_source(sittig_1980)[0] != canonicalize_source(sittig_1981)[0]
        assert "1980" in canonicalize_source(sittig_1980)[0]
        journal = "Chattopadhyay S, Ziemann PJ; Aerosol Science and Technology, 39:1085-1100 (2005)"
        assert canonicalize_source(journal) == (
            "Chattopadhyay S, Ziemann PJ; Aerosol Science and Technology 39 (2005)", "1085-1100")

        bureau_1981 = "Bureau of Explosives; Emergency Handling of Haz Matl in Surface Trans p.94 (1981)"
        bureau_2002 = ("Association of American Railroads/Bureau of Explosives; Emergency Handling of "
                       "Hazardous Materials in Surface Transportation. Pueblo, CO. 2002")
        assert canonicalize_source(bureau_1981)[0] != canonicalize_source(bureau_2002)[0]
        hoak = ("Hoak RD; Purdue Eng Ext Serv 41: 229 (1957) as cited in USEPA; Ambient Water Quality "
                "Criteria Doc: Chlorinated Phenols p.C-2 (1980) EPA 440/5-80-032")
        assert "440/5-80-032" not in canonicalize_source(hoak)[0]
        assert "1957" in canonicalize_source(hoak)[0]
        sax_12 = ("Lewis, R.J. Sr. (ed) Sax's Dangerous Properties of Industrial Materials. 12th ed. "
                  "Wiley-Interscience, Wiley & Sons, Inc. Hoboken, NJ. 2012., p. 448`")
        sax_12_bare = sax_12.split("., p.")[0]
        assert canonicalize_source(sax_12)[0] == canonicalize_source(sax_12_bare)[0]
        jprs_plural = ("Aleksandrov VN; Toxic Agents. Washington, DC: Joint Publications Research Service. "
                       "NTIS JPRS 48748 (1969)")
        jprs_singular = jprs_plural.replace("Publications", "Publication")
        jprs_paged = ("NTIS; JPRS 48748 Aleksandrov VN Toxic Agents. Joint Publications Research Service. "
                      "Washington, DC p.43-122 Chpt 3 (1969)")
        assert canonicalize_source(jprs_plural)[0] == canonicalize_source(jprs_singular)[0]
        assert canonicalize_source(jprs_plural)[0] == canonicalize_source(jprs_paged)[0]
        assert canonicalize_source(jprs_paged)[1] == "43-122"
        hansch_hash = "Hansch C, Leo A; Medchem Project, Claremont, CA: Pomona College. Issue #26 (1985)"
        hansch_no = "Hansch C, Leo AJ; Medchem Project Issue No. 26 (1985)"
        assert canonicalize_source(hansch_hash)[0] == canonicalize_source(hansch_no)[0]
        assert canonicalize_source(hansch_no)[0] != canonicalize_source(
            "Hansch C, Leo AJ; Medchem Project Issue No. 19 (1981)")[0]
        agr = "Buttery RG et al; J Agr Food Chem 17 (1969)"
        agric = "Buttery RG et al; J Agric Food Chem 17 (1969)"
        assert canonicalize_source(agr)[0] == canonicalize_source(agric)[0]
        assert canonicalize_source(agr)[0] != canonicalize_source(
            "Buttery RG et al; J Agric Food Chem 19 (1971)")[0]
        atmos_3 = "Atkinson R; Atmos Chem Phys 3"
        atmos_3_et = "Atkinson R et al; Atmos Chem Phys 3"
        assert canonicalize_source(atmos_3)[0] == canonicalize_source(atmos_3_et)[0]
        assert canonicalize_source(atmos_3)[0] != canonicalize_source("Atkinson R et al; Atmos Chem Phys 6")[0]


class TestParseExperimental:
    def test_stem_has_no_page_or_hash(self):
        assert citation_ref_code(_CRC) == "CRCHandbook-ed88-2007"
        assert citation_ref_code(_MERCK) == "MerckIndex-2013"
        assert depositor_ref_code("Hazardous Substances Data Bank (HSDB)", "6341") == "HSDB-6341"

    def test_parse_groups_citations_under_heading(self):
        properties, refs = parse_experimental(_body(), 62750)
        qty = (_Q(342.3, "°C"),)
        merck = "The Merck Index - An Encyclopedia of Chemicals, Drugs, and Biologicals. 2013"
        assert properties == [
            ExperimentalProperty("Melting Point", (
                ExperimentalCitation("342.3 °C", qty, "CRCHandbook-ed88-2007", None, "4-57", strip_page(_CRC)),
                ExperimentalCitation("342.3 °C", qty, "MerckIndex-2013", None, "396", merck),
            )),
        ]
        assert {r["refCode"] for r in refs} == {"CRCHandbook-ed88-2007", "MerckIndex-2013"}
        assert all("page" not in r and "p. 4-57" not in r["source"] for r in refs)

    def test_same_work_with_a_dropped_word(self):
        same = [
            ("Atkinson R; Int J Chem Kinet 19 (1987)", "Atkinson R; Internat J Chem Kin 19 (1987)"),
            ("DOI:10.1021/acs.est.2c00201 | https://tarheels.live/bakerlab/", "DOI:10.1021/acs.est.2c00201"),
            ("Daubert TE, Danner RP; Physical and Thermodynamic Properties of Pure Chemicals Data Compilation (1997)",
             "Daubert TE, Danner RP; Physical and Thermodynamic Properties of Pure Chemicals Data Compilation. "
             "Design Institute. Hemisphere (1997) Supplement 7"),
            ("Dean JA; Lange's Handbook of Chemistry. 13th ed.",
             "Dean, J.A. (ed.). Lange's Handbook of Chemistry. 13 ed. New York, NY: McGraw-Hill Book Co., 1985"),
            ("Flick EW; Industrial Solvents Handbook. 4th ed Park Ridge, NJ: Noyes Data Corp (1991)",
             "Flick, E.W. (ed.). Industrial Solvents Handbook 4 th ed. Noyes Data Corporation., Park Ridge, NJ., 1991"),
            ("General Electric Co; Material Safety Data Sheet MSDS #3 (1984)",
             "General Electric Co; Material Safety Data Sheet #389 (1984)"),
            ("Yalkowsky SH, Dannenfelser RM; Aquasol Database of Aqueous Solubility. 5th ed. 1992",
             "Yalkowsky SH, He Yan, Jain P; Handbook of Aqueous Solubility Data. (1992)"),
            ("Zwolinksi BJ, Wilhoit RC; Handbook of vapor pressures and heats of vaporizaton of hydrocarbons "
             "and related compounds (1971)",
             "Zwolinski BJ, Wilhoit RC; Handbook of Vapor Pressures and Heats of Formation of Hydrocarbons "
             "and Related Compounds (1971)"),
            ("Boublick T et al; The Vapor Pressure of Pure Substances. Amsterdam, The Netherlands: "
             "Elsevier Sci Publ (1984)",
             "Boublik T et al; The Vapor Pressures of Pure Substances Vol 17 (1984)"),
            ("Boublik T et al; The Vapor Pressures of Pure Substances Vol 17 (1984)",
             "Boublik T et al; The Vapor Pressures of Pure Substances (1984)"),
            ("MSDS", "From MSDS"),
            ("MSDS Label", "From MSDS."),
            ("Fire Protection Guide to Hazardous Materials. 13 ed. Quincy, MA: National Fire Protection Association, 2002",
             "Fire Protection Guide to Hazardous Materials. 13 ed. Quincy, MA: National Fire Protection Association, "
             "2002., p. 325-69-"),
        ]
        for left, right in same:
            assert canonicalize_source(left)[0] == canonicalize_source(right)[0]
        assert canonicalize_source("DOI:10.1021/acs.est.2c00201")[0] != canonicalize_source(
            "DOI:10.1021/acs.jproteome.1c00820")[0]
        assert canonicalize_source(
            "General Electric Co; Material Safety Data Sheet #434 (1982)")[0] != canonicalize_source(
            "General Electric Co; Material Safety Data Sheet #3 (1984)")[0]
        assert canonicalize_source(
            "Riddick JA et al; Organic Solvents NY,NY: John Wiley & Sons Inc. (1984)")[0] != canonicalize_source(
            "Riddick JA et al; Organic Solvents. 4th ed. NY: Wiley (1986)")[0]
        assert canonicalize_source(
            "Yalkowsky SH, He Yan, Jain P; Handbook of Aqueous Solubility Data. (2003)")[0] != canonicalize_source(
            "Yalkowsky SH, Dannenfelser RM; Aquasol Database of Aqueous Solubility. 5th ed. 1992")[0]
        epi_312_2000 = "US EPA; Estimation Program Interface (EPI) Suite. Ver.3.12. 2000"
        epi_312_2004 = "US EPA; Estimation Program Interface (EPI) Suite. Ver.3.12. Nov 30, 2004"
        epi_311 = "US EPA; Estimation Program Interface (EPI) Suite. Ver.3.11. June 10, 2003"
        epi_311_windows = ("US EPA; Estimation Programs Interface (EPI). ver. 3.11. "
                           "U.S. EPA version for Windows. Washington, DC: U.S. EPA (2003)")
        epi_41_jan = "US EPA; Estimation Program Interface (EPI) Suite. Ver. 4.1. Jan, 2011"
        epi_41_nov = "US EPA; Estimation Program Interface (EPI) Suite. Ver. 4.1. Nov, 2012"
        epi_41_hydro = "US EPA; Estimation Program Interface (EPI) Suite. PCHYDRO. Ver. 4.1. Nov, 2012"
        epi_411 = "US EPA; Estimation Program Interface (EPI) Suite. Ver. 4.11. Nov, 2012"
        epi_411_file = epi_411 + ". EPI Suite Links. SRC Fate Pointer File"
        assert canonicalize_source(epi_312_2000)[0] == canonicalize_source(epi_312_2004)[0]
        assert canonicalize_source(epi_311)[0] == canonicalize_source(epi_311_windows)[0]
        assert canonicalize_source(epi_41_jan)[0] == canonicalize_source(epi_41_nov)[0]
        assert canonicalize_source(epi_41_hydro) == (
            "US EPA; Estimation Program Interface (EPI) Suite. Ver. 4.1", "PCHYDRO")
        assert canonicalize_source(epi_411)[0] == canonicalize_source(epi_411_file)[0]
        assert canonicalize_source(epi_41_jan)[0] != canonicalize_source(epi_411)[0]
        assert canonicalize_source(epi_311)[0] != canonicalize_source(epi_312_2000)[0]
        assert canonicalize_source("LI,J & PERDUE,EM (1995)")[0] == canonicalize_source(
            "LI,J & PURDUE,EM (1995)")[0]
        assert canonicalize_source(
            "Southwick GR, Keller JL; Water Air Soil Pollut 28 (1986)")[0] == canonicalize_source(
            "Southworth GR, Keller JL; Water Air Soil Pollut 28 (1986)")[0]
        assert canonicalize_source("TACAKS-NOVAK,K ET AL. (1995)")[0] == canonicalize_source(
            "TAKACS-NOVAK,K ET AL. (1995)")[0]
        assert "Purdue" in canonicalize_source(
            "Hoak RD; Purdue Eng Ext Serv 41 (1957)")[0]
        assert canonicalize_source("MEYLAN,WM & HOWARD,PH (1995)")[0] == (
            "Meylan WM, Howard PH; J Pharm Sci 84 (1995)")
        assert canonicalize_source("MEYLAN,WM et al. (1996)")[0] == (
            "Meylan WM, Howard PH, Boethling RS; Environ Toxicol Chem 15 (1996)")
        assert canonicalize_source("Meylan WM, Howard PH; Environ Toxicol Chem 10 (1991)")[0] != (
            "Meylan WM, Howard PH, Boethling RS; Environ Toxicol Chem 15 (1996)")
        assert canonicalize_source(
            "Khan I, Brimblecombe P; J Aerosol Sci 23(Suppl. 1): S897-S900 (1992)") == (
            "Khan I, Brimblecombe P; J Aerosol Sci 23 (1992)", "S897-S900")

    def test_register_assigns_index_and_disambiguates_stem(self, tmp_path: Path):
        path = tmp_path / "pubchem-references.jsonl"
        properties, pending = parse_experimental(_body(), 1)
        pending.append({
            "refCode": "CRCHandbook-ed88-2007", "source": strip_page(_CRC_OTHER),
        })
        updated, new_rows = register_sources(path, properties, pending)
        assert [r["refNumber"] for r in new_rows] == [1, 2, 3]
        assert {r["refCode"] for r in new_rows} == {
            "CRCHandbook-ed88-2007", "MerckIndex-2013", "CRCHandbook-ed88-2007-2",
        }
        assert all("page" not in r for r in new_rows)
        cite = updated[0].citation[0]
        assert cite.ref_number == 1 and cite.ref_code == "CRCHandbook-ed88-2007"
        assert cite.ref_page == "4-57" and cite.source is None
        assert cite.to_json() == {
            "text": "342.3 °C",
            "values": [{"number": 342.3, "unit": "°C"}],
            "refCode": "CRCHandbook-ed88-2007", "refNumber": 1, "refPage": "4-57",
        }
        multi = parse_quantities("Red: Triple point = 590 °C; sublimation point = 431 °C")
        assert [q.to_json() for q in multi] == [
            {"spec": "Red: Triple point", "number": 590.0, "unit": "°C"},
            {"spec": "sublimation point", "number": 431.0, "unit": "°C"},
        ]

    def test_depositor_only(self):
        body = {
            "Record": {
                "Reference": [{"ReferenceNumber": 1, "SourceName": "CAMEO Chemicals", "SourceID": "8234",
                               "URL": "https://example.test/cameo"}],
                "Section": [{"TOCHeading": "Color", "Information": [
                    {"ReferenceNumber": 1, "Value": {"StringWithMarkup": [{"String": "white"}]}}]}],
            },
        }
        properties, refs = parse_experimental(body, 1)
        assert properties[0].citation[0].ref_code == "CAMEO-8234"
        assert properties[0].citation[0].text == "white"
        assert properties[0].citation[0].values == ()
        assert properties[0].citation[0].source.startswith("NOAA; CAMEO Chemicals")
        assert refs[0]["refCode"] == "CAMEO-8234"
        assert refs[0]["source"].startswith("NOAA; CAMEO Chemicals")

    def test_empty_body(self):
        assert parse_experimental(None, 1) == ([], [])

    def test_page_helper(self):
        assert page_of("… p. 4-57") == "4-57"
        assert strip_page(_CRC).endswith("2007") and "4-57" not in strip_page(_CRC)


class TestSlimStorage:
    def test_append_writes_citation_and_catalog_without_source_on_value(self, tmp_path: Path):
        view = PubchemView.from_experimental_response(62750, "2026-10-14T10:00:00+00:00", 200, "https://x", _body())
        record = pubchem_record("12182-83-1", "inorganic", [{"CID": 62750, "MolecularFormula": "X"}],
                                experimental=(view,))
        path = tmp_path / "pubchem-inorganic.jsonl"
        append_pubchem_record(path, record)
        line = path.read_text(encoding="utf-8")
        assert '"citation":' in line
        assert '"text": "342.3 °C"' in line
        assert '"number": 342.3' in line and '"unit": "°C"' in line
        assert '"refCode": "CRCHandbook-ed88-2007"' in line
        assert '"refNumber": 1' in line
        assert '"refPage": "4-57"' in line
        assert _CRC[:40] not in line
        assert "a1b2c3d4" not in line and "Long HSDB essay" not in line
        refs = read_pubchem_references(tmp_path / "pubchem-references.jsonl")
        assert refs["CRCHandbook-ed88-2007"]["refNumber"] == 1
        assert "page" not in refs["CRCHandbook-ed88-2007"]
        assert "p. 4-57" not in refs["CRCHandbook-ed88-2007"]["source"]
        assert refs["MerckIndex-2013"]["refNumber"] == 2
        append_pubchem_record(path, record)
        assert len(read_pubchem_references(tmp_path / "pubchem-references.jsonl")) == 2
        assert compact_pubchem_files([path]) == 1  # second compound line superseded; refs keep numbers
