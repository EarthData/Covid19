require 'nokogiri'
require 'open-uri'
require 'yaml'

class Scraper

  def scrape_url(url, date, debug) 

    config = YAML.load_file("config.yml")

    domain = URI(url).hostname.split('.').last(2).first
    puts "Domain: #{domain}" if debug
    if config['country'][domain] 
      tld = config['country'][domain]
    else
      tld = URI(url).hostname.split('.').last.upcase
    end
    puts "TLD: #{tld}" if debug

    if !config['cleanurl'][domain] 
      clean_url = url
    else
      clean_url = url.split('?')[url.split('?').length - 2]
    end

    file = clean_url.split('/').last
    document = File.basename(file,File.extname(file))

    if config['article'][domain] == "last"
      document = document.split('-').last
    elsif config['article'][domain] == "last_"
      document = document.split('_').last
    elsif config['article'][domain] == "lastdot"
      document = clean_url.split('.').last
    elsif config['article'][domain] == "lastcomma"
      document = document.split(',').last
    elsif config['article'][domain] == "first"
      document = document.split('-').first
    elsif config['article'][domain] == "previous"
      document = clean_url.split('/')[clean_url.split('/').length - 2]
    elsif config['article'][domain] == "page"
      document = clean_url.split('/').last.split("=")[1]
    end

    puts "filename: #{document}" if debug

    html = URI.open(url, "Accept-Encoding" => "plain") 
    doc = Nokogiri::HTML(html)

    # sitename
    if config['sitename'][domain]
      site_name = config['sitename'][domain]
      puts "Site Name: #{site_name} (config)" if debug
    elsif doc.at("meta[property='og:site_name']")
      site_name = doc.at("meta[property='og:site_name']")['content'].to_s.strip
      puts "Site Name: #{site_name} (og)" if debug
    else
      site_name = domain
      puts "Site Name: #{site_name} (domain)" if debug
    end

    # description
    if doc.at("meta[name='description']")
      description = doc.at("meta[name='description']")['content'].to_s.strip
      puts "Description: #{description} (meta)" if debug
    elsif doc.at("meta[property='og:description']")
      description = doc.at("meta[property='og:description']")['content'].to_s.strip
      puts "Description: #{description} (og)" if debug
    else 
      description = ""
      puts "Description not found" if debug
    end

    # date
    if doc.at("meta[name='publish-date']")
      published_time = doc.at("meta[name='publish-date']")['content'].to_s.strip
      puts "Date: #{published_time} (meta publish-date)" if debug
    elsif doc.at("meta[name='date']")
      published_time = doc.at("meta[name='date']")['content'].to_s.strip
      puts "Date: #{published_time} (meta date)" if debug
    elsif doc.at("meta[property='article:published_time']")
      published_time = doc.at("meta[property='article:published_time']")['content'].to_s.strip
      puts "Date: #{published_time} (meta article:published_time)" if debug
    end

    if published_time
      published_time.gsub! '- ', '-'
    end

    if date and published_time
      if date != DateTime.parse(published_time.strip).strftime("%Y-%m-%d")
        puts "date #{date} not equal to published_time #{published_time}"
      end
    elsif date and !published_time
      puts "no pubished_time found" if debug
      published_time = date
    elsif !date and !published_time
      puts "no date found"
      exit 1
    end

    tags = Array.new
    if config['tag'][domain]
      tags.push(config['tag'][domain])
    else
      tags.push(site_name.downcase)
    end
 
    published_date = DateTime.parse(published_time.strip)
    date  = published_date.strftime("%Y-%m-%d")

    filename = date + "-" + domain + "_" + document

    # subtitle
    if doc.at("meta[property='og:title']") and config['subtitle'][domain] and config['subtitle'][domain] != "ignore-og"
      subtitle = doc.at("meta[property='og:title']")['content'].to_s.strip
      puts "Title: :#{subtitle}: (meta og:title)" if debug
    elsif doc.at("meta[property='og:title']")
      subtitle = doc.at("meta[property='og:title']")['content'].to_s.strip
      puts "Title: :#{subtitle}: (meta og:title)" if debug
    elsif doc.at("/html/head//title")
      subtitle = doc.xpath("/html/head/title").first.text.strip.chomp
      puts "Title: :#{subtitle}: (head title)" if debug
    elsif doc.xpath("/html/body//h1")
      subtitle = doc.xpath("/html/body//h1").first.text.strip.chomp
      puts "Title: :#{subtitle}: (first h1)" if debug
    else
      puts "no title found"
      exit 1
    end

    if config['subtitle'][domain] && config['subtitle'][domain] = 'last'
      subtitle.gsub!(/[\s]+[|][\s]+.*$/, "")
      puts "Change title to: #{subtitle}" if debug
    end

    if config['subtitle'][domain] && config['subtitle'][domain] = 'last-'
      subtitle.gsub!(/[\s]+[-][\s]+.*$/, "")
      puts "Change title to: #{subtitle}" if debug
    end

    #title = '' if not (title.force_encoding("UTF-8").valid_encoding?)
    #title = title.chars.select(&:valid_encoding?).join
    #puts "Title: :" + title.delete!("^\u{0000}-\u{007F}") + ":"
    #puts "Title: :" + title.strip_control_characters + ":"
    #puts "Title: :" + title.strip_control_and_extended_characters + ":"

    site_data = Hash.new

    site_data['date'] = date
    site_data['redirect'] = clean_url
    site_data['title'] = site_name
    site_data['subtitle'] = subtitle.gsub(/'/, "’")
    site_data['country'] = tld
    site_data['categories'] = []
    site_data['tags'] = tags
    site_data['filename'] = filename

    return site_data

  end
end
